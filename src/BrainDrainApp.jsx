import { Navigate, Route, Routes } from "react-router-dom";
import { BackpackProvider } from "./backpacks/BackpackContext";
import BackpackFormScreen from "./backpacks/screens/BackpackFormScreen";
import BackpackScreen from "./backpacks/screens/BackpackScreen";
import ChooseBackpackScreen from "./backpacks/screens/ChooseBackpackScreen";
import HomeScreen from "./backpacks/screens/HomeScreen";
import ManageHomeScreen from "./backpacks/screens/ManageHomeScreen";
import NoteScreen from "./backpacks/screens/NoteScreen";
import "./backpacks/backpacks.css";

// The signed-in app. Notebooks are presented as "backpacks"; data stays in the
// same per-user localStorage record the previous notebook UI used.
export default function BrainDrainApp({ user, onLogout }) {
  return (
    <BackpackProvider user={user} onLogout={onLogout}>
      <div className="bp-app">
        <Routes>
          <Route index element={<HomeScreen />} />
          <Route path="backpacks" element={<ChooseBackpackScreen />} />
          <Route path="backpacks/new" element={<BackpackFormScreen />} />
          <Route path="home/manage" element={<ManageHomeScreen />} />
          <Route path="b/:id" element={<BackpackScreen />} />
          <Route path="b/:id/edit" element={<BackpackFormScreen />} />
          <Route path="note/new" element={<NoteScreen key="new" />} />
          <Route path="note/:id" element={<NoteScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BackpackProvider>
  );
}
