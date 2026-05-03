import { useCallback, useEffect, useMemo, useState } from "react";
import type { MapDriverPoint } from "../../components/maps/mapDriverPoints.js";
import { AppMap } from "../../components/maps/AppMap.js";
import type { Motoristas } from "../../Models/index.js";
import { motoristasService } from "../../services/motoristasService.js";
import "./MotoristasMapa.modulo.css";

function toMapPoints(list: Motoristas[]): MapDriverPoint[] {
  return list
    .filter(
      (m) =>
        m.lat != null &&
        m.lng != null &&
        Number.isFinite(m.lat) &&
        Number.isFinite(m.lng),
    )
    .map((m) => ({
      id: m.id,
      lat: m.lat as number,
      lng: m.lng as number,
      title: `${m.carModel} · ${m.plate} · ${m.status}`,
    }));
}

export default function MotoristasMapa() {
  const [motoristas, setMotoristas] = useState<Motoristas[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await motoristasService.buscarTodos();
      setMotoristas(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível carregar motoristas.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = window.setInterval(load, 15_000);
    return () => clearInterval(id);
  }, [load]);

  const points = useMemo(() => toMapPoints(motoristas), [motoristas]);

  const comPosicao = motoristas.filter(
    (m) =>
      m.lat != null &&
      m.lng != null &&
      Number.isFinite(m.lat) &&
      Number.isFinite(m.lng),
  ).length;

  return (
    <div className="motoristasMapa">
      <div className="motoristasMapa_header">
        <h1 className="motoristasMapa_title">Motoristas no mapa</h1>
        <p className="motoristasMapa_lead">
          Posições indicativas (lat/lng na API). Atualização automática a cada
          15&nbsp;s.
        </p>
        <p className="motoristasMapa_meta" aria-live="polite">
          {loading && !motoristas.length ? (
            "A carregar…"
          ) : (
            <>
              <strong>{comPosicao}</strong> com localização no mapa
              {motoristas.length > 0 ? (
                <>
                  {" "}
                  · <strong>{motoristas.length}</strong> motoristas no total
                </>
              ) : null}
            </>
          )}
        </p>
      </div>

      {error ? (
        <p className="motoristasMapa_error" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && comPosicao === 0 && !error ? (
        <p className="motoristasMapa_empty">
          Ainda não há motoristas com coordenadas (lat/lng). Os marcadores
          aparecem quando a API regista a posição (por exemplo após atualização
          pelo motorista).
        </p>
      ) : null}

      <div className="motoristasMapa_mapWrap">
        <AppMap drivers={points} />
      </div>
    </div>
  );
}
