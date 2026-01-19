<<<<<<< HEAD
import Sidebar from "../components/Sidebar";

const DashboardLayout = ({ children }) => {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: "20px" }}>
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;
=======
import Sidebar from "../components/Sidebar";

const DashboardLayout = ({ children }) => {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: "20px" }}>
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;
>>>>>>> cffba6ef64ed296d8c4df653b6d3296f72cfa3da
