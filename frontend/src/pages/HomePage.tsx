import { AppMap } from "../components/maps/AppMap.js";
import "./HomePage.modulo.css";

export default function HomePage() {
  return (
    <div className="homePage">
      <div>
        <h1 className="homePage_heading">Painel</h1>
        <p className="homePage_lead">
          Mapa de exemplo (Mapbox ou Google conforme variáveis de ambiente).
        </p>
      </div>
      <div className="homePage_mapWrap">
        <AppMap />
      </div>
    </div>
  );
}
