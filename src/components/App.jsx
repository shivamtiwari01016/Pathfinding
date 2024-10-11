import Map from "./Map";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

/**
 * Creates a custom white theme for the application.
 */
const lightTheme = createTheme({
  palette: {
    mode: "light",
  },
});

/**
 * The main application component.
 */
function App() {
  return (
    <ThemeProvider theme={lightTheme}>
      {/* Normalize CSS styles across different browsers */}
      <CssBaseline />
      {/* Render the Map component */}
      <Map />
    </ThemeProvider>
  );
}

export default App;
