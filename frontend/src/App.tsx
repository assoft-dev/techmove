import { Route, Routes } from "react-router-dom";
import RootLayout from "./layouts/RootLayout.js";
import AceitarCorrida from "./Paginas/Corrida/AceitarCorrida.js";
import FinalizarCorrida from "./Paginas/Corrida/FinalizarCorrida.js";
import HistoricoCorrida from "./Paginas/Corrida/HistoricoCorrida.js";
import PedirCorrida from "./Paginas/Corrida/PedirCorrida.js";
import RastrearCorrida from "./Paginas/Corrida/RastrearCorrida.js";
import PainelAdmin from "./Paginas/Admin/PainelAdmin.js";
import DashboardMotorista from "./Paginas/Dashboard/DashboardMotorista.js";
import DashboardPassageiro from "./Paginas/Dashboard/DashboardPassageiro.js";
import LoginPage from "./Paginas/Login/LoginPage.js";
import MotoristasMapa from "./Paginas/Motorista/MotoristasMapa.js";
import HomePage from "./pages/HomePage.js";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="corrida/pedir" element={<PedirCorrida />} />
        <Route path="corrida/:rideId/rastrear" element={<RastrearCorrida />} />
        <Route path="corrida/aceitar" element={<AceitarCorrida />} />
        <Route path="corrida/finalizar" element={<FinalizarCorrida />} />
        <Route path="corrida/historico" element={<HistoricoCorrida />} />
        <Route path="dashboard/passageiro" element={<DashboardPassageiro />} />
        <Route path="dashboard/motorista" element={<DashboardMotorista />} />
        <Route path="admin/painel" element={<PainelAdmin />} />
        <Route path="motoristas/mapa" element={<MotoristasMapa />} />
      </Route>
    </Routes>
  );
}
