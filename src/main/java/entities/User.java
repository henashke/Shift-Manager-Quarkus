package entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User extends BaseEntity {

    @Column(name = "name")
    public String name;

    @Column(name = "password")
    public String password;

    @Column(name = "score")
    public Integer score;

    @Column(name = "role")
    public String role = "user";

}
