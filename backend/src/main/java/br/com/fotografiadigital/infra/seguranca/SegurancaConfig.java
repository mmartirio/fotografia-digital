package br.com.fotografiadigital.infra.seguranca;

import jakarta.servlet.DispatcherType;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;

import br.com.fotografiadigital.aplicacao.acesso.SessaoService;

/**
 * API stateless autenticada por cookies httpOnly:
 * - /api/publico/** livre;
 * - /api/cliente/** exige sessão de cliente (link mágico);
 * - /api/painel/** exige sessão de admin (fotógrafo).
 * CSRF: cookies SameSite=Lax + mutações só aceitam JSON/multipart vindos do próprio site
 * (o navegador não envia o cookie em POST de outro domínio).
 */
@Configuration
public class SegurancaConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, SessaoService sessoes) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .httpBasic(basic -> basic.disable())
                .formLogin(form -> form.disable())
                .logout(logout -> logout.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(e -> e.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .addFilterBefore(new SessaoFiltro(sessoes), AnonymousAuthenticationFilter.class)
                .authorizeHttpRequests(auth -> auth
                        // Downloads em streaming (ZIP) e páginas de erro reentram no filtro
                        .dispatcherTypeMatchers(DispatcherType.ASYNC, DispatcherType.ERROR).permitAll()
                        .requestMatchers("/actuator/health/**").permitAll()
                        .requestMatchers("/api/publico/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/api/cliente/**").hasRole("CLIENTE")
                        .requestMatchers("/api/painel/**").hasRole("ADMIN")
                        .anyRequest().denyAll())
                .build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }
}
