/**
 * Layout — Page wrapper
 * ---------------------
 * Wraps every page with a navbar and footer.
 * Used via <Outlet /> inside React Router's nested routes.
 */

import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import EmailVerifyBanner from "./EmailVerifyBanner";
import Footer from "./Footer";

function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <EmailVerifyBanner /> 
      <div className="flex-1 flex flex-col">
        {/* <Outlet /> renders whichever page matches the current route */}
        <Outlet />
      </div>
 
      <Footer />
    </div>
  );
}

export default Layout;