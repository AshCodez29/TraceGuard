package com.traceguard.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.MockMvc;

import com.traceguard.auth.AuthController;

@WebMvcTest(controllers = {SecurityTestController.class, AuthController.class})
@Import({SecurityConfiguration.class, SecurityTestBeans.class})
class SecurityConfigurationTest {
    @Autowired
    private MockMvc mockMvc;

    @Test
    void protectedEndpointRejectsMissingToken() throws Exception {
        mockMvc.perform(get("/api/test/protected"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginIsPublicAndReturnsTheFrontendContract() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"priya\",\"password\":\"password\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.user.username").value("priya"))
                .andExpect(jsonPath("$.user.role").value("DEVELOPER"))
                .andExpect(jsonPath("$.user.organization").value("Northwind Labs"));
    }

    @Test
    void incorrectLoginReturnsUnauthorizedWithoutPasswordDetails() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"priya\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid username or password"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    void protectedEndpointAcceptsValidBearerToken() throws Exception {
        mockMvc.perform(get("/api/test/protected").header("Authorization", "Bearer " + SecurityTestBeans.token("priya", "DEVELOPER")))
                .andExpect(status().isOk());
    }

    @Test
    void authorizationUsesServerRoleAuthorities() throws Exception {
        mockMvc.perform(get("/api/test/admin").header("Authorization", "Bearer " + SecurityTestBeans.token("priya", "DEVELOPER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminRoleReceivesAdminPermission() throws Exception {
        mockMvc.perform(get("/api/test/admin").header("Authorization", "Bearer " + SecurityTestBeans.token("admin", "ADMIN")))
                .andExpect(status().isOk());
    }

    @Test
    void corsPreflightAllowsConfiguredFrontendAndBearerHeaders() throws Exception {
        mockMvc.perform(options("/api/test/protected")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET")
                        .header("Access-Control-Request-Headers", "authorization,content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                .andExpect(header().exists("Access-Control-Allow-Headers"));
    }

}
