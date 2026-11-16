package com.traceguard.projects;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {
    private final ProjectService service;
    public ProjectController(ProjectService service) { this.service = service; }

    @GetMapping public List<Map<String,Object>> list(Principal p) { return service.list(p.getName()); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> create(@Valid @RequestBody ProjectRequest body, Principal p) { return service.create(p.getName(), body); }
    @GetMapping("/{id}") public Map<String,Object> get(@PathVariable long id, Principal p) { return service.get(id,p.getName()); }
    @PatchMapping("/{id}") public Map<String,Object> patch(@PathVariable long id, @RequestBody ProjectPatch body, Principal p) { return service.patch(id,p.getName(),body); }
    @GetMapping("/{id}/connections") public List<Map<String,Object>> connections(@PathVariable long id, Principal p) { service.authorize(id,p.getName(),false); return service.connections(id); }
    @PostMapping("/{id}/connections") @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> connect(@PathVariable long id, @Valid @RequestBody ConnectionRequest body, Principal p) { return service.connect(id,p.getName(),body); }
    @GetMapping("/{id}/schema") public Map<String,Object> schema(@PathVariable long id, Principal p) { return service.schema(id,p.getName()); }
    @PostMapping("/{id}/scans") @ResponseStatus(HttpStatus.CREATED) public Map<String,Object> scan(@PathVariable long id, Principal p) { return service.scan(id,p.getName()); }
    @GetMapping("/{id}/issues") public List<Map<String,Object>> projectIssues(@PathVariable long id, Principal p) { return service.projectIssues(id,p.getName()); }
    @GetMapping("/{id}/scans") public List<Map<String,Object>> projectScans(@PathVariable long id, Principal p) { service.authorize(id,p.getName(),false); return service.scans(id); }

    public record ProjectRequest(@NotBlank @Size(max=120) String name, @Size(max=2000) String description) {}
    public record ProjectPatch(@Size(max=120) String name, @Size(max=2000) String description, String status) {}
    public record ConnectionRequest(@NotBlank @Size(max=80) String name, @NotBlank String jdbcUrl,
            @NotBlank @Size(max=80) String username, @NotBlank String password, @NotBlank @Size(max=80) String schemaName) {}
}
