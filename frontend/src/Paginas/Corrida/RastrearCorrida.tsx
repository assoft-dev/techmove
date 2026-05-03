import { useEffect, useMemo, useState } from "react";
import {
  Link,
  Navigate,
  useParams,
} from "react-router-dom";
import { AppMap } from "../../components/maps/AppMap.js";
import type { MapDriverPoint } from "../../components/maps/mapDriverPoints.js";
import type { Corridas } from "../../Models/index.js";
import { corridasService } from "../../services/corridasService.js";
import { ensureSocket } from "../../services/socketManager.js";
import { useSessionStore } from "../../store/sessionStore.js";
import { rideStatusLabelPt } from "./corridaUi.js";
import "./RastrearCorrida.modulo.css";

type DriverLocationPayload = {
  rideId: number;
  lat: number;
  lng: number;
  driverId?: number;
};

export default function RastrearCorrida() {
  const { rideId: rideIdParam } = useParams<{ rideId: string }>();
  const token = useSessionStore((s) => s.token);
  const user = useSessionStore((s) => s.user);

  const rideId = rideIdParam ? Number(rideIdParam) : NaN;

  const [corrida, setCorrida] = useState<Corridas | null>(null);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !Number.isFinite(rideId)) return;

    let cancelled = false;

    async function loadRide() {
      try {
        setFetchError(null);
        const c = await corridasService.buscar(rideId);
        if (cancelled) return;
        setCorrida(c);
      } catch (e) {
        if (!cancelled) {
          setFetchError(
            e instanceof Error ? e.message : "Corrida não encontrada.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRide();
    const poll = window.setInterval(loadRide, 12_000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [token, rideId]);

  useEffect(() => {
    if (!token || !corrida || user?.id !== corrida.clientId) return;

    const socket = ensureSocket(token);

    socket.emit("ride:join", { rideId }, (ack: { ok?: boolean; error?: string }) => {
      if (!ack?.ok) {
        setSocketError(ack?.error ?? "Não foi possível entrar na sala da corrida.");
      }
    });

    function onCorridaAtualizada(payload: { corrida: Corridas }) {
      setCorrida(payload.corrida);
      if (payload.corrida.status === "completed" || payload.corrida.status === "cancelled") {
        setDriverPos(null);
      }
    }

    function onDriverLocation(p: DriverLocationPayload) {
      if (p.rideId !== rideId) return;
      setDriverPos({ lat: p.lat, lng: p.lng });
    }

    socket.on("corrida:atualizada", onCorridaAtualizada);
    socket.on("driver:location", onDriverLocation);

    return () => {
      socket.off("corrida:atualizada", onCorridaAtualizada);
      socket.off("driver:location", onDriverLocation);
    };
  }, [token, corrida, user?.id, rideId]);

  const markers: MapDriverPoint[] | undefined = useMemo(() => {
    if (!corrida) return undefined;
    const list: MapDriverPoint[] = [
      {
        id: corrida.id * 10 + 1,
        lat: corrida.pickupLat,
        lng: corrida.pickupLng,
        title: "Recolha",
        pin: "pickup",
      },
      {
        id: corrida.id * 10 + 2,
        lat: corrida.dropLat,
        lng: corrida.dropLng,
        title: "Destino",
        pin: "drop",
      },
    ];
    if (driverPos) {
      list.push({
        id: (corrida.driverId ?? 0) + 400_000,
        lat: driverPos.lat,
        lng: driverPos.lng,
        title: "Motorista",
        pin: "driver",
      });
    }
    return list;
  }, [corrida, driverPos]);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "client") {
    return (
      <div className="rastrear_wrap">
        <div className="rastrear_blocked">
          <p>O rastreamento ao vivo é para o passageiro da corrida.</p>
          <Link to="/">Início</Link>
        </div>
      </div>
    );
  }

  if (!Number.isFinite(rideId)) {
    return (
      <div className="rastrear_wrap">
        <p className="rastrear_error">Identificador da corrida inválido.</p>
      </div>
    );
  }

  const statusHint = (() => {
    if (!corrida) return "";
    if (corrida.status === "requested" && corrida.driverId == null) {
      return "A procurar motorista próximo da recolha…";
    }
    if (corrida.status === "requested" && corrida.driverId != null) {
      return "Motorista atribuído.";
    }
    if (corrida.status === "accepted") {
      return "Motorista a caminho — posição em tempo real quando disponível.";
    }
    if (corrida.status === "in_progress") {
      return "Viagem em curso.";
    }
    if (corrida.status === "completed") {
      return "Corrida concluída.";
    }
    if (corrida.status === "cancelled") {
      return "Corrida cancelada.";
    }
    return "";
  })();

  return (
    <div className="rastrear_wrap">
      <h1 className="rastrear_title">Acompanhar corrida</h1>
      <p className="rastrear_lead">
        Pedido #{rideId} ·{" "}
        {corrida ? (
          <strong>{rideStatusLabelPt(corrida.status)}</strong>
        ) : (
          "…"
        )}
      </p>

      {loading ? <p className="rastrear_meta">A carregar…</p> : null}
      {fetchError ? (
        <p className="rastrear_error" role="alert">
          {fetchError}
        </p>
      ) : null}
      {socketError ? (
        <p className="rastrear_error" role="alert">
          {socketError}
        </p>
      ) : null}

      {corrida && corrida.clientId !== user.id ? (
        <p className="rastrear_error" role="alert">
          Esta corrida não pertence à tua conta.
        </p>
      ) : null}

      {corrida && corrida.clientId === user.id ? (
        <>
          <p className="rastrear_status">{statusHint}</p>
          <div className="rastrear_mapWrap">
            <AppMap drivers={markers} />
          </div>
          <p className="rastrear_hint">
            O sistema notifica automaticamente os motoristas disponíveis mais
            próximos da recolha. Quando um motorista aceita, vês o estado aqui e,
            após o início da viagem, a posição atualiza em tempo real (GPS do
            motorista).
          </p>
          <p className="rastrear_footer">
            <Link to="/corrida/historico" className="rastrear_link">
              Histórico
            </Link>
            {" · "}
            <Link to="/dashboard/passageiro" className="rastrear_link">
              Painel passageiro
            </Link>
          </p>
        </>
      ) : null}
    </div>
  );
}
