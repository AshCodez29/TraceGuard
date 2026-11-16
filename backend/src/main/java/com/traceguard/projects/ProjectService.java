package com.traceguard.projects;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.sql.*;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

@Service
public class ProjectService {
    private static final Pattern MYSQL_URL = Pattern.compile("^jdbc:mysql://([^/:?]+)(?::([0-9]+))?/([A-Za-z0-9_$-]+)(?:\\?.*)?$");
    private static final SecureRandom RANDOM = new SecureRandom();
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;
    private final String encryptionKey;
    private final Set<String> allowedHosts;

    public ProjectService(JdbcTemplate jdbc, ObjectMapper json,
                          @Value("${traceguard.datasource-encryption-key}") String encryptionKey,
                          @Value("${traceguard.allowed-target-hosts:localhost,127.0.0.1}") String hosts) {
        this.jdbc = jdbc; this.json = json; this.encryptionKey = encryptionKey;
        this.allowedHosts = new HashSet<>();
        Arrays.stream(hosts.split(",")).map(String::trim).filter(s -> !s.isBlank()).map(s -> s.toLowerCase(Locale.ROOT)).forEach(allowedHosts::add);
    }

    public List<Map<String,Object>> list(String username) {
        User user = user(username);
        String sql = user.role.equals("ADMIN")
                ? "SELECT p.project_id,p.name,p.description,p.status,p.owner_id,u.username AS owner_username,p.created_at,p.updated_at FROM projects p JOIN users u ON u.user_id=p.owner_id ORDER BY p.project_id"
                : "SELECT DISTINCT p.project_id,p.name,p.description,p.status,p.owner_id,u.username AS owner_username,p.created_at,p.updated_at FROM projects p JOIN users u ON u.user_id=p.owner_id LEFT JOIN project_assignments a ON a.project_id=p.project_id WHERE p.owner_id=? OR a.user_id=? ORDER BY p.project_id";
        return user.role.equals("ADMIN") ? jdbc.queryForList(sql) : jdbc.queryForList(sql, user.id, user.id);
    }

    public Map<String,Object> create(String username, ProjectController.ProjectRequest request) {
        User user = user(username);
        if (user.role.equals("AUDITOR")) throw forbidden();
        try {
            KeyHolder key = new GeneratedKeyHolder();
            jdbc.update(c -> { var ps = c.prepareStatement("INSERT INTO projects(owner_id,name,description,status) VALUES(?,?,?,'ACTIVE')", Statement.RETURN_GENERATED_KEYS); ps.setLong(1,user.id); ps.setString(2,request.name().trim()); ps.setString(3,request.description()); return ps; }, key);
            return get(number(key.getKey()), username);
        } catch (DuplicateKeyException e) { throw new ResponseStatusException(HttpStatus.CONFLICT, "Project name already exists for this owner"); }
    }

    public Map<String,Object> get(long id, String username) { authorize(id,username,false); return project(id); }
    public Map<String,Object> patch(long id, String username, ProjectController.ProjectPatch req) {
        authorize(id,username,true);
        if (req.name()==null && req.description()==null && req.status()==null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"At least one project field is required");
        String status = req.status();
        if (status != null && !Set.of("ACTIVE","ARCHIVED").contains(status)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Status must be ACTIVE or ARCHIVED");
        try {
            jdbc.update("UPDATE projects SET name=COALESCE(?,name), description=COALESCE(?,description), status=COALESCE(?,status) WHERE project_id=?",
                    req.name()==null?null:req.name().trim(), req.description(), status, id);
        } catch (DuplicateKeyException e) { throw new ResponseStatusException(HttpStatus.CONFLICT,"Project name already exists for this owner"); }
        return project(id);
    }

    public void authorize(long id, String username, boolean write) {
        User user=user(username);
        var rows=jdbc.queryForList("SELECT owner_id FROM projects WHERE project_id=?",id);
        if(rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Project not found");
        if(user.role.equals("ADMIN")) return;
        long owner=((Number)rows.get(0).get("owner_id")).longValue();
        boolean assigned=jdbc.queryForObject("SELECT COUNT(*) FROM project_assignments WHERE project_id=? AND user_id=?",Integer.class,id,user.id)>0;
        if(write) {
            if(user.role.equals("DEVELOPER") && (owner==user.id || assigned && assignmentAccess(id,user.id).equals("CONTRIBUTOR"))) return;
            throw forbidden();
        }
        if(owner==user.id || assigned) return;
        throw forbidden();
    }

    public List<Map<String,Object>> connections(long projectId) {
        return jdbc.queryForList("SELECT source_id,project_id,name,schema_name,created_by,created_at FROM data_sources WHERE project_id=? ORDER BY source_id",projectId);
    }

    public Map<String,Object> connect(long projectId,String username,ProjectController.ConnectionRequest req) {
        authorize(projectId,username,true);
        Matcher m=MYSQL_URL.matcher(req.jdbcUrl());
        if(!m.matches()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"A valid MySQL JDBC URL is required");
        String host=m.group(1).toLowerCase(Locale.ROOT), schema=m.group(3);
        int port=m.group(2)==null?3306:Integer.parseInt(m.group(2));
        if(!allowedHosts.contains(host)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Database host is not allowed");
        if(!schema.equals(req.schemaName()) || !schema.equals("northwind_broken")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"This demo connection must target northwind_broken");
        String url="jdbc:mysql://"+host+":"+port+"/"+schema+"?serverTimezone=UTC&useSSL=false&allowPublicKeyRetrieval=true";
        try(Connection c=DriverManager.getConnection(url,req.username(),req.password())) { c.setReadOnly(true); ensureReadOnly(c); c.getMetaData().getTables(schema,null,"%",new String[]{"TABLE"}).close(); }
        catch(SQLException e) { throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,"Could not connect to target database with the supplied credentials"); }
        User user=user(username);
        try {
            KeyHolder key=new GeneratedKeyHolder();
            jdbc.update(c->{var ps=c.prepareStatement("INSERT INTO data_sources(name,jdbc_url,db_username,password_encrypted,schema_name,created_by,project_id) VALUES(?,?,?,?,?,?,?)",Statement.RETURN_GENERATED_KEYS); ps.setString(1,req.name().trim()); ps.setString(2,url); ps.setString(3,req.username()); ps.setString(4,encrypt(req.password())); ps.setString(5,schema); ps.setLong(6,user.id); ps.setLong(7,projectId); return ps;},key);
            return jdbc.queryForMap("SELECT source_id,project_id,name,schema_name,created_by,created_at FROM data_sources WHERE source_id=?",number(key.getKey()));
        } catch(DuplicateKeyException e) { throw new ResponseStatusException(HttpStatus.CONFLICT,"Connection name already exists"); }
    }

    public Map<String,Object> schema(long projectId,String username) {
        authorize(projectId,username,false); Source source=source(projectId);
        try(Connection c=target(source);) {
            DatabaseMetaData md=c.getMetaData(); List<Map<String,Object>> tables=new ArrayList<>();
            try(ResultSet rs=md.getTables(source.schema,null,"%",new String[]{"TABLE"})) {
                while(rs.next()) { String table=rs.getString("TABLE_NAME"); List<String> pks=new ArrayList<>();
                    try(ResultSet p=md.getPrimaryKeys(source.schema,null,table)){while(p.next())pks.add(p.getString("COLUMN_NAME"));}
                    List<Map<String,Object>> columns=new ArrayList<>();
                    try(ResultSet col=md.getColumns(source.schema,null,table,"%")){while(col.next()) columns.add(Map.of("name",col.getString("COLUMN_NAME"),"type",col.getString("TYPE_NAME"),"size",col.getInt("COLUMN_SIZE"),"nullable",col.getInt("NULLABLE")!=DatabaseMetaData.columnNoNulls,"primaryKey",pks.contains(col.getString("COLUMN_NAME"))));}
                    List<Map<String,Object>> fks=new ArrayList<>();
                    try(ResultSet f=md.getImportedKeys(source.schema,null,table)){while(f.next()) fks.add(Map.of("column",f.getString("FKCOLUMN_NAME"),"referencedTable",f.getString("PKTABLE_NAME"),"referencedColumn",f.getString("PKCOLUMN_NAME")));}
                    tables.add(Map.of("name",table,"columns",columns,"foreignKeys",fks));
                }
            }
            return Map.of("projectId",projectId,"connectionId",source.id,"schema",source.schema,"tables",tables);
        } catch(SQLException e) { throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,"Could not inspect target schema"); }
    }

    public Map<String,Object> scan(long projectId,String username) {
        authorize(projectId,username,true); Source source=source(projectId); User user=user(username);
        long pack=jdbc.queryForObject("SELECT rule_pack_id FROM rule_packs WHERE name='northwind-ecommerce' AND active=1",Long.class);
        KeyHolder key=new GeneratedKeyHolder();
        jdbc.update(c->{var ps=c.prepareStatement("INSERT INTO scans(source_id,rule_pack_id,started_by,status,project_id) VALUES(?,?,?,'RUNNING',?)",Statement.RETURN_GENERATED_KEYS);ps.setLong(1,source.id);ps.setLong(2,pack);ps.setLong(3,user.id);ps.setLong(4,projectId);return ps;},key);
        long scanId=number(key.getKey());
        try(Connection target=target(source)) {
            target.setReadOnly(true); DatabaseMetaData md=target.getMetaData(); Set<String> tableNames=new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
            try(ResultSet rs=md.getTables(source.schema,null,"%",new String[]{"TABLE"})){while(rs.next()) tableNames.add(rs.getString("TABLE_NAME"));}
            Map<String,TableInfo> infos=new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
            for(String t:tableNames) infos.put(t,tableInfo(target,source.schema,t));
            Map<String,Long> counts=new TreeMap<>(String.CASE_INSENSITIVE_ORDER); Map<String,Long> scanTableIds=new HashMap<>();
            for(TableInfo info:infos.values()) {
                long count=count(target,"SELECT COUNT(*) FROM "+q(info.name)); counts.put(info.name,count);
                KeyHolder tk=new GeneratedKeyHolder(); jdbc.update(c->{var ps=c.prepareStatement("INSERT INTO scan_tables(scan_id,table_name,row_count) VALUES(?,?,?)",Statement.RETURN_GENERATED_KEYS);ps.setLong(1,scanId);ps.setString(2,info.name);ps.setLong(3,count);return ps;},tk); long stid=number(tk.getKey());scanTableIds.put(info.name,stid);
                for(Col col:info.cols.values()) { long nulls=col.nullable?count(target,"SELECT COUNT(*) FROM "+q(info.name)+" WHERE "+q(col.name)+" IS NULL"):0;
                    long distinct=count(target,"SELECT COUNT(DISTINCT "+q(col.name)+") FROM "+q(info.name));
                    jdbc.update("INSERT INTO scan_columns(scan_table_id,column_name,data_type,is_nullable,is_primary_key,null_count,distinct_count) VALUES(?,?,?,?,?,?,?)",stid,col.name,col.type,col.nullable,col.pk,nulls,distinct);
                }
            }
            int issues=0;
            issues+=runRequiredRules(target,source.schema,scanId,pack,infos,counts);
            issues+=runNaturalKeyRules(target,scanId,pack,infos,counts);
            issues+=runRelationshipRules(target,source.schema,scanId,pack,infos,counts);
            jdbc.update("UPDATE scans SET status='COMPLETED',finished_at=CURRENT_TIMESTAMP,issues_found=? WHERE scan_id=?",issues,scanId);
            return scanDetail(scanId);
        } catch(Exception e) {
            String message=e instanceof ResponseStatusException rse && rse.getReason()!=null?rse.getReason():"Integrity scan failed while inspecting the target database";
            jdbc.update("UPDATE scans SET status='FAILED',finished_at=CURRENT_TIMESTAMP,error_message=? WHERE scan_id=?",truncate(message,500),scanId);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,"Scan failed; failure status was recorded for scan "+scanId);
        }
    }

    public List<Map<String,Object>> scans(long projectId) { return jdbc.queryForList("SELECT scan_id,project_id,source_id,status,started_at,finished_at,issues_found,error_message FROM scans WHERE project_id=? ORDER BY started_at DESC",projectId); }
    public List<Map<String,Object>> projectIssues(long projectId,String username) { authorize(projectId,username,false);return jdbc.queryForList("SELECT i.issue_id,i.scan_id,it.code AS issue_type,i.severity,i.table_name,i.column_name,i.related_table,i.related_column,i.affected_rows,i.total_rows,i.status,i.created_at FROM issues i JOIN issue_types it ON it.issue_type_id=i.issue_type_id JOIN scans s ON s.scan_id=i.scan_id WHERE s.project_id=? ORDER BY i.issue_id",projectId); }
    public Map<String,Object> scanDetail(long scanId) { var rows=jdbc.queryForList("SELECT scan_id,project_id,source_id,rule_pack_id,started_by,status,started_at,finished_at,issues_found,error_message FROM scans WHERE scan_id=?",scanId); if(rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Scan not found"); return rows.get(0); }
    public Map<String,Object> authorizedScanDetail(long scanId,String username) { Map<String,Object> detail=scanDetail(scanId); authorize(((Number)detail.get("project_id")).longValue(),username,false); return detail; }
    public List<Map<String,Object>> scanIssues(long scanId) { scanDetail(scanId); var issues=jdbc.queryForList("SELECT i.issue_id,i.scan_id,it.code AS issue_type,it.description,i.severity,i.table_name,i.column_name,i.related_table,i.related_column,i.affected_rows,i.total_rows,i.status,i.created_at FROM issues i JOIN issue_types it ON it.issue_type_id=i.issue_type_id WHERE i.scan_id=? ORDER BY i.issue_id",scanId); for(var i:issues) i.put("evidence",jdbc.queryForList("SELECT sample_id,sample_order,sample_json FROM issue_samples WHERE issue_id=? ORDER BY sample_order",i.get("issue_id"))); return issues; }
    public List<Map<String,Object>> scanList(Long projectId) { return projectId==null?jdbc.queryForList("SELECT scan_id,project_id,source_id,status,started_at,finished_at,issues_found,error_message FROM scans ORDER BY started_at DESC"):scans(projectId); }

    private int runRequiredRules(Connection c,String schema,long scan,long pack,Map<String,TableInfo> infos,Map<String,Long> counts)throws SQLException {
        int found=0; for(Map<String,Object> r:jdbc.queryForList("SELECT table_name,column_name FROM pack_column_rules WHERE rule_pack_id=? AND rule_type='REQUIRED'",pack)) {
            String table=(String)r.get("table_name"),col=(String)r.get("column_name"); TableInfo t=infos.get(table); if(t==null||!t.cols.containsKey(col))continue;
            long n=count(c,"SELECT COUNT(*) FROM "+q(t.name)+" WHERE "+q(t.cols.get(col).name)+" IS NULL"); if(n==0)continue;
            String key=t.cols.values().stream().filter(x->x.pk).map(x->q(x.name)).findFirst().orElse(q(col));
            List<Map<String,Object>> sample=sample(c,"SELECT "+key+" FROM "+q(t.name)+" WHERE "+q(col)+" IS NULL LIMIT 5"); persistIssue(scan,"NULL_VALUE","HIGH",t.name,col,null,null,n,counts.get(t.name),sample); found++;
        } return found;
    }
    private int runNaturalKeyRules(Connection c,long scan,long pack,Map<String,TableInfo> infos,Map<String,Long> counts)throws SQLException {
        int found=0; Map<String,List<String>> grouped=new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
        for(Map<String,Object> r:jdbc.queryForList("SELECT table_name,column_name FROM pack_column_rules WHERE rule_pack_id=? AND rule_type='NATURAL_KEY' ORDER BY table_name,column_name",pack)) grouped.computeIfAbsent((String)r.get("table_name"),k->new ArrayList<>()).add((String)r.get("column_name"));
        for(var e:grouped.entrySet()){TableInfo t=infos.get(e.getKey());if(t==null)continue;List<String> cols=e.getValue().stream().filter(t.cols::containsKey).map(x->t.cols.get(x).name).toList();if(cols.isEmpty())continue;
            String group=String.join(",",cols.stream().map(ProjectService::q).toList()); long groups=count(c,"SELECT COUNT(*) FROM (SELECT 1 FROM "+q(t.name)+" GROUP BY "+group+" HAVING COUNT(*)>1) dup");
            if(groups>0){long rows=count(c,"SELECT COALESCE(SUM(n),0) FROM (SELECT COUNT(*) n FROM "+q(t.name)+" GROUP BY "+group+" HAVING COUNT(*)>1) dup");List<Map<String,Object>> sample=sample(c,"SELECT "+group+",COUNT(*) AS duplicate_count FROM "+q(t.name)+" GROUP BY "+group+" HAVING COUNT(*)>1 LIMIT 5");persistIssue(scan,"DUPLICATE_EXACT","MEDIUM",t.name,String.join(",",cols),null,null,rows,counts.get(t.name),sample);found++;}
        }return found;
    }
    private int runRelationshipRules(Connection c,String schema,long scan,long pack,Map<String,TableInfo> infos,Map<String,Long> counts)throws SQLException {
        int found=0; List<Map<String,Object>> rules=jdbc.queryForList("SELECT s.kind,s.from_table,s.from_column,s.to_table,s.to_column FROM traceability_chains ch JOIN chain_steps s ON s.chain_id=ch.chain_id WHERE ch.rule_pack_id=? ORDER BY ch.chain_id,s.step_order",pack);
        Set<String> seen=new HashSet<>(); for(Map<String,Object> r:rules){String kind=(String)r.get("kind"),ft=(String)r.get("from_table"),fc=(String)r.get("from_column"),tt=(String)r.get("to_table"),tc=(String)r.get("to_column");String key=kind+ft+fc+tt+tc;if(!seen.add(key))continue;
            TableInfo from=infos.get(ft),to=infos.get(tt);if(from==null||to==null||!from.cols.containsKey(fc)||!to.cols.containsKey(tc))continue;
            String sql; String table,col,related,relcol;
            if(kind.equals("PARENT")){sql="SELECT COUNT(*) FROM "+q(from.name)+" f LEFT JOIN "+q(to.name)+" p ON f."+q(fc)+"=p."+q(tc)+" WHERE f."+q(fc)+" IS NOT NULL AND p."+q(tc)+" IS NULL";table=from.name;col=from.cols.get(fc).name;related=to.name;relcol=to.cols.get(tc).name;}
            else {sql="SELECT COUNT(*) FROM "+q(from.name)+" p WHERE NOT EXISTS (SELECT 1 FROM "+q(to.name)+" c WHERE c."+q(tc)+"=p."+q(fc)+")";table=from.name;col=from.cols.get(fc).name;related=to.name;relcol=to.cols.get(tc).name;}
            long n=count(c,sql); jdbc.update("INSERT IGNORE INTO scan_relationships(scan_id,from_table,from_column,to_table,to_column,origin,status,method,reasoning) VALUES(?,?,?,?,?,'DECLARED','DECLARED','RULE_PACK','Configured integrity relationship')",scan,from.name,fc,to.name,tc);
            if(kind.equals("PARENT") && !hasForeignKey(c,schema,from.name,fc,to.name,tc)) {
                persistIssue(scan,"MISSING_FK","MEDIUM",from.name,fc,to.name,tc,1,counts.get(from.name),List.of(Map.of("expectedForeignKey",from.name+"."+fc+" -> "+to.name+"."+tc,"declared",false)));
                found++;
            }
            if(n==0)continue;
            String sampleKey=from.cols.values().stream().filter(x->x.pk).map(x->(kind.equals("PARENT")?"f.":"p.")+q(x.name)).findFirst().orElse((kind.equals("PARENT")?"f.":"p.")+q(fc));
            String sampleSql=kind.equals("PARENT")?"SELECT "+sampleKey+",f."+q(fc)+" AS offending_reference FROM "+q(from.name)+" f LEFT JOIN "+q(to.name)+" p ON f."+q(fc)+"=p."+q(tc)+" WHERE f."+q(fc)+" IS NOT NULL AND p."+q(tc)+" IS NULL LIMIT 5":"SELECT "+sampleKey+" FROM "+q(from.name)+" p WHERE NOT EXISTS (SELECT 1 FROM "+q(to.name)+" c WHERE c."+q(tc)+"=p."+q(fc)+") LIMIT 5";
            List<Map<String,Object>> sample=sample(c,sampleSql);
            persistIssue(scan,kind.equals("CHILD")?"BROKEN_TRACE_CHAIN":"ORPHAN_RECORD","HIGH",table,col,related,relcol,n,counts.get(table),sample);found++;
        }return found;
    }
    private List<Map<String,Object>> sample(Connection c,String sql)throws SQLException {
        List<Map<String,Object>> out=new ArrayList<>(); try(Statement s=c.createStatement();ResultSet rs=s.executeQuery(sql)){ResultSetMetaData md=rs.getMetaData();while(rs.next()){Map<String,Object> row=new LinkedHashMap<>();for(int i=1;i<=md.getColumnCount();i++)row.put(md.getColumnLabel(i),rs.getObject(i));out.add(row);}}return out;
    }
    private void persistIssue(long scan,String code,String severity,String table,String col,String related,String relcol,long affected,long total,List<Map<String,Object>> samples) {
        int type=jdbc.queryForObject("SELECT issue_type_id FROM issue_types WHERE code=?",Integer.class,code);
        KeyHolder k=new GeneratedKeyHolder(); jdbc.update(c->{var ps=c.prepareStatement("INSERT INTO issues(scan_id,issue_type_id,severity,table_name,column_name,related_table,related_column,affected_rows,total_rows,status) VALUES(?,?,?,?,?,?,?,?,?,'OPEN')",Statement.RETURN_GENERATED_KEYS);ps.setLong(1,scan);ps.setInt(2,type);ps.setString(3,severity);ps.setString(4,table);ps.setString(5,col);ps.setString(6,related);ps.setString(7,relcol);ps.setLong(8,affected);ps.setLong(9,total);return ps;},k);
        long issue=number(k.getKey()); int order=1; for(Map<String,Object> sample:samples){try{jdbc.update("INSERT INTO issue_samples(issue_id,sample_order,sample_json) VALUES(?,?,CAST(? AS JSON))",issue,order++,json.writeValueAsString(sample));}catch(JsonProcessingException e){throw new IllegalStateException(e);}}
    }
    private TableInfo tableInfo(Connection c,String schema,String table)throws SQLException {TableInfo t=new TableInfo(table);DatabaseMetaData md=c.getMetaData();Set<String> pks=new HashSet<>();try(ResultSet rs=md.getPrimaryKeys(schema,null,table)){while(rs.next())pks.add(rs.getString("COLUMN_NAME").toLowerCase(Locale.ROOT));}try(ResultSet rs=md.getColumns(schema,null,table,"%")){while(rs.next()){String name=rs.getString("COLUMN_NAME");t.cols.put(name,new Col(name,rs.getString("TYPE_NAME"),rs.getInt("NULLABLE")!=DatabaseMetaData.columnNoNulls,pks.contains(name.toLowerCase(Locale.ROOT))));}}return t;}
    private boolean hasForeignKey(Connection c,String schema,String table,String column,String parent,String parentColumn)throws SQLException {try(ResultSet rs=c.getMetaData().getImportedKeys(schema,null,table)){while(rs.next())if(rs.getString("FKCOLUMN_NAME").equalsIgnoreCase(column)&&rs.getString("PKTABLE_NAME").equalsIgnoreCase(parent)&&rs.getString("PKCOLUMN_NAME").equalsIgnoreCase(parentColumn))return true;}return false;}
    private long count(Connection c,String sql)throws SQLException {try(Statement s=c.createStatement();ResultSet rs=s.executeQuery(sql)){rs.next();return rs.getLong(1);}}
    private Source source(long project){var rows=jdbc.queryForList("SELECT source_id,jdbc_url,db_username,password_encrypted,schema_name FROM data_sources WHERE project_id=? ORDER BY source_id DESC LIMIT 1",project);if(rows.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND,"No database connection is configured for this project");var r=rows.get(0);return new Source(((Number)r.get("source_id")).longValue(),(String)r.get("jdbc_url"),(String)r.get("db_username"),decrypt((String)r.get("password_encrypted")),(String)r.get("schema_name"));}
    private Connection target(Source s)throws SQLException {Connection c=DriverManager.getConnection(s.url,s.username,s.password);try{c.setReadOnly(true);ensureReadOnly(c);try(Statement st=c.createStatement()){st.execute("SET SESSION TRANSACTION READ ONLY");}return c;}catch(SQLException e){c.close();throw e;}}
    private void ensureReadOnly(Connection c)throws SQLException {
        boolean hasSelect=false;
        try(Statement s=c.createStatement();ResultSet rs=s.executeQuery("SHOW GRANTS FOR CURRENT_USER()")) {
            while(rs.next()) { String grant=rs.getString(1).trim().toUpperCase(Locale.ROOT);
                if(grant.matches("GRANT (USAGE|SELECT(, SELECT)*) ON .*")) { if(grant.startsWith("GRANT SELECT"))hasSelect=true; }
                else if(grant.startsWith("GRANT ")) throw new SQLException("Target account has non-read-only grants");
            }
        }
        if(!hasSelect)throw new SQLException("Target account does not have a read-only SELECT grant");
    }
    private User user(String username){var rows=jdbc.queryForList("SELECT u.user_id,r.name FROM users u JOIN roles r ON r.role_id=u.role_id WHERE u.username=? AND u.enabled=1",username);if(rows.isEmpty())throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Authenticated user was not found or is disabled");return new User(((Number)rows.get(0).get("user_id")).longValue(),(String)rows.get(0).get("name"));}
    private String assignmentAccess(long project,long user){return jdbc.queryForObject("SELECT access_level FROM project_assignments WHERE project_id=? AND user_id=?",String.class,project,user);}
    private Map<String,Object> project(long id){var rows=jdbc.queryForList("SELECT p.project_id,p.name,p.description,p.status,p.owner_id,u.username AS owner_username,p.created_at,p.updated_at FROM projects p JOIN users u ON u.user_id=p.owner_id WHERE p.project_id=?",id);if(rows.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Project not found");return rows.get(0);}
    private static long number(Number n){if(n==null)throw new IllegalStateException("Database did not return generated identifier");return n.longValue();}
    private static String q(String ident){return "`"+ident.replace("`","``")+"`";}
    private static String truncate(String s,int n){return s.length()>n?s.substring(0,n):s;}
    private static ResponseStatusException forbidden(){return new ResponseStatusException(HttpStatus.FORBIDDEN,"You do not have access to this project operation");}
    private String encrypt(String plain){try{byte[] nonce=new byte[12];RANDOM.nextBytes(nonce);Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.ENCRYPT_MODE,key(),new GCMParameterSpec(128,nonce));byte[] encrypted=c.doFinal(plain.getBytes(StandardCharsets.UTF_8));ByteBuffer b=ByteBuffer.allocate(nonce.length+encrypted.length);b.put(nonce).put(encrypted);return Base64.getEncoder().encodeToString(b.array());}catch(Exception e){throw new IllegalStateException("Could not secure database credential");}}
    private String decrypt(String cipherText){try{byte[] data=Base64.getDecoder().decode(cipherText);ByteBuffer b=ByteBuffer.wrap(data);byte[] nonce=new byte[12];b.get(nonce);byte[] ct=new byte[b.remaining()];b.get(ct);Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.DECRYPT_MODE,key(),new GCMParameterSpec(128,nonce));return new String(c.doFinal(ct),StandardCharsets.UTF_8);}catch(Exception e){throw new IllegalStateException("Could not read stored database credential");}}
    private SecretKeySpec key()throws Exception{return new SecretKeySpec(MessageDigest.getInstance("SHA-256").digest(encryptionKey.getBytes(StandardCharsets.UTF_8)),"AES");}
    private record User(long id,String role){}
    private record Source(long id,String url,String username,String password,String schema){}
    private static final class TableInfo{final String name;final Map<String,Col>cols=new TreeMap<>(String.CASE_INSENSITIVE_ORDER);TableInfo(String n){name=n;}}
    private record Col(String name,String type,boolean nullable,boolean pk){}
}
