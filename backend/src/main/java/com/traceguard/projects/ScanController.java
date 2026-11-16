package com.traceguard.projects;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/scans")
public class ScanController {
    private final ProjectService service;
    public ScanController(ProjectService service) { this.service = service; }

    @GetMapping public List<Map<String,Object>> list(@RequestParam(required=false) Long projectId, Principal principal) {
        if (projectId == null) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST,"projectId is required");
        service.authorize(projectId, principal.getName(), false);
        return service.scanList(projectId);
    }
    @GetMapping("/{scanId}") public Map<String,Object> get(@PathVariable long scanId, Principal principal) {
        return service.authorizedScanDetail(scanId, principal.getName());
    }
    @GetMapping("/{scanId}/issues") public List<Map<String,Object>> issues(@PathVariable long scanId, Principal principal) {
        service.authorizedScanDetail(scanId, principal.getName());
        return service.scanIssues(scanId);
    }
}
