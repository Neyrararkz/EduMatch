import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../app/AuthProvider";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [university, setUniversity] = useState("");
  const [course, setCourse] = useState("1");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      await register({
        fullName,
        email,
        password,
        university,
        course: Number(course),
      });

      navigate("/dashboard");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Registration failed");
    }
  }

  return (
    <section>
      <h1>Register</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Full name</label>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </div>

        <div>
          <label>Email</label>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
          />
        </div>

        <div>
          <label>Password</label>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
          />
        </div>

        <div>
          <label>University</label>
          <input
            value={university}
            onChange={(event) => setUniversity(event.target.value)}
          />
        </div>

        <div>
          <label>Course</label>
          <input
            value={course}
            onChange={(event) => setCourse(event.target.value)}
            type="number"
            min="1"
          />
        </div>

        {error && <p>{error}</p>}

        <button type="submit">Create account</button>
      </form>
    </section>
  );
}