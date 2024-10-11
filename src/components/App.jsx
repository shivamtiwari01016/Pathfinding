import Map from "./Map";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

/**
 * Creates a custom dark theme for the application.
 */
const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

/**
 * The main application component.
 */
function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      {/* Normalize CSS styles across different browsers */}
      <CssBaseline />
      {/* Render the Map component */}
      <Map />
    </ThemeProvider>
  );
}

export default App;
