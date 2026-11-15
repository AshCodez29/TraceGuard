package com.traceguard;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:traceguard-context;DB_CLOSE_DELAY=-1;MODE=MySQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false",
        "traceguard.jwt.secret=context-test-secret-with-at-least-32-bytes",
        "traceguard.datasource-encryption-key=context-test-encryption-key",
        "traceguard.llm.api-key=test-only"
})
class BackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
