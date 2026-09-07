import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const signInMock = vi.fn();
const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next-auth/react", () => ({ signIn: (...args: unknown[]) => signInMock(...args) }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
  useSearchParams: () => new URLSearchParams(),
}));

const { default: LoginPage } = await import("@/app/login/page");

describe("LoginPage", () => {
  it("muestra un mensaje de error cuando las credenciales son incorrectas", async () => {
    signInMock.mockResolvedValue({ error: "CredentialsSignin" });
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "admin@itson.edu.mx" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "incorrecta" } });
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() =>
      expect(screen.getByText("Correo o contraseña incorrectos.")).toBeInTheDocument(),
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("redirige al panel administrativo cuando el inicio de sesión es correcto", async () => {
    signInMock.mockResolvedValue({ error: undefined });
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "admin@itson.edu.mx" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "correcta" } });
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/admin"));
  });
});
