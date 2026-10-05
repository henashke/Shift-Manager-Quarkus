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

    // Reservists (מילואים) are scheduled only when chosen, e.g. left out of suggestions by default
    @Column(name = "reserve")
    public boolean reserve;

    // False only for accounts that are never scheduled (the built-in system admin); being an admin doesn't affect it
    @Column(name = "schedulable")
    public boolean schedulable = true;

}
