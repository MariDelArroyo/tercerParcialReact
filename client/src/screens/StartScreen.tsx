import { useState } from "react";

import type { FormEvent } from "react";

interface StartScreenProps {
  onStart: (player1: string, player2: string) => Promise<void>;
  notice: string | null;
}

export default function StartScreen({ onStart, notice }: StartScreenProps) {
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setSending(true);
    await onStart(player1.trim(), player2.trim());
    setSending(false);
  };

  return (
    <main className="start-screen">
      <section className="start-card">
        <h1>🚀 Nébula: Duelo Estelar</h1>
        <p className="subtitle">
          Dos capitanes pelean en una nebulosa disputando cristales de energía.
          Reúne energía, dispara y protege tu nave. Gana quien destruya al rival
          o quede con más casco al final de la partida.
        </p>

        <form className="start-form" onSubmit={handleSubmit}>
          <label>
            <span>Capitan 1</span>
            <input
              data-testid="input-jugador-1"
              type="text"
              value={player1}
              placeholder="Nombre del jugador 1"
              maxLength={12}
              onChange={(event) => setPlayer1(event.target.value)}
            />
          </label>
          <label>
            <span>Capitan 2</span>
            <input
              data-testid="input-jugador-2"
              type="text"
              value={player2}
              placeholder="Nombre del jugador 2"
              maxLength={12}
              onChange={(event) => setPlayer2(event.target.value)}
            />
          </label>

          {notice !== null ? (
            <p className="notice" role="alert">
              ⚠️ {notice}
            </p>
          ) : null}

          <button type="submit" className="primary-button" disabled={sending}>
            {sending ? "Creando..." : "Comenzar partida"}
          </button>
        </form>

        <details className="instructions">
          <summary>📖 Cómo se juega</summary>
          <ul>
            <li>
              <strong>Cada turno</strong> el jugador activo elige <em>una</em>{" "}
              acción: moverse, reunir energía, disparar, activar escudo o pasar.
            </li>
            <li>
              <strong>Mover</strong>: desplazarse una celda en cualquier
              dirección. No puedes entrar en la celda del rival. Si mueves tu
              nave sobre un cristal 💠, lo <strong>recolectas al pasar</strong>{" "}
              (+12 de energía).
            </li>
            <li>
              <strong>Reunir</strong>: si tu nave está sobre un cristal 💠 al
              iniciar tu turno (por ejemplo, porque derivó hacia ti), obtienes{" "}
              <strong>+12 de energía</strong> sin gastar el movimiento.
            </li>
            <li>
              <strong>Disparar</strong> (cuesta 8 de energía): un rayo viaja en
              línea recta. Los cristales lo bloquean, así que piensa la
              trayectoria.
            </li>
            <li>
              <strong>Escudo</strong> (cuesta 10 de energía): reduce el próximo
              disparo recibido a 5 de daño.
            </li>
            <li>
              <strong>Atención cometa</strong> ☄️: cada cierto turnos entra un
              cometa que cruza la nebulosa y daña todo lo que toque.
            </li>
            <li>
              <strong>Fin de partida</strong>: luego de {""}60{" "}
              turnos gana quien tenga más casco; si igualan, empate.
            </li>
          </ul>
        </details>
      </section>
    </main>
  );
}