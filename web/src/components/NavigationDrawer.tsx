import { Drawer, IconButton } from "@mui/joy";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Icon from "./Icon";
import Navigation from "./Navigation";

const NavigationDrawer = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const toggleDrawer = (inOpen: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (event.type === "keydown" && ((event as React.KeyboardEvent).key === "Tab" || (event as React.KeyboardEvent).key === "Shift")) {
      return;
    }

    setOpen(inOpen);
  };

  return (
    <div className="sm:hidden">
      <IconButton onClick={toggleDrawer(true)}>
        <Icon.Menu className="w-5 h-auto dark:text-gray-200" />
      </IconButton>
      <Drawer anchor="left" size="sm" open={open} onClose={toggleDrawer(false)}>
        <div className="w-full px-4">
          <Navigation />
        </div>
      </Drawer>
    </div>
  );
};

export default NavigationDrawer;
