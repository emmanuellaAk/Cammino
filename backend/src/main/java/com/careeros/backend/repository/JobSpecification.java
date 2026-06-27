package com.careeros.backend.repository;

import com.careeros.backend.entity.ApplicationStatus;
import com.careeros.backend.entity.Job;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public final class JobSpecification {

    private JobSpecification() {}

    public static Specification<Job> belongsTo(UUID userId) {
        return (root, query, cb) -> cb.equal(root.get("user").get("id"), userId);
    }

    public static Specification<Job> withStatus(ApplicationStatus status) {
        return (root, query, cb) ->
                status == null ? cb.conjunction() : cb.equal(root.get("status"), status);
    }

    public static Specification<Job> withCompany(String company) {
        return (root, query, cb) ->
                company == null || company.isBlank() ? cb.conjunction()
                        : cb.like(cb.lower(root.get("company")), "%" + company.toLowerCase() + "%");
    }

    public static Specification<Job> withSearch(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) return cb.conjunction();
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("jobTitle")), pattern),
                    cb.like(cb.lower(root.get("company")), pattern),
                    cb.like(cb.lower(root.get("location")), pattern)
            );
        };
    }
}
