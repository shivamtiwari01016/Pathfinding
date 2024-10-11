import DeckGL from "@deck.gl/react";
import { Map as MapGL } from "react-map-gl";
import maplibregl from "maplibre-gl";
import { PolygonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { FlyToInterpolator } from "deck.gl";
import { TripsLayer } from "@deck.gl/geo-layers";
import { createGeoJSONCircle } from "../helpers";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { getBoundingBoxFromPolygon, getMapGraph, getNearestNode } from "../services/MapService";
import PathfindingState from "../models/PathfindingState";
import Interface from "./Interface";
import { INITIAL_COLORS, INITIAL_VIEW_STATE, MAP_STYLE } from "../config";
import useSmoothStateChange from "../hooks/useSmoothStateChange";

function Map() {
    const [startNode, setStartNode] = useState(null);
    const [endNode, setEndNode] = useState(null);
    const [selectionRadius, setSelectionRadius] = useState([]);
    const [tripsData, setTripsData] = useState([]);
    const [started, setStarted] = useState(false);
    const [time, setTime] = useState(0);
    const [animationEnded, setAnimationEnded] = useState(false);
    const [playbackOn, setPlaybackOn] = useState(false);
    const [playbackDirection, setPlaybackDirection] = useState(1);
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({ algorithm: "astar", radius: 4, speed: 5 });
    const [colors, setColors] = useState(INITIAL_COLORS);
    const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
    const ui = useRef();
    const requestRef = useRef();
    const previousTimeRef = useRef();
    const timer = useRef(0);
    const waypoints = useRef([]);
    const state = useRef(new PathfindingState());
    
    // Smooth state change for selection radius opacity
    const selectionRadiusOpacity = useSmoothStateChange(0, 0, 1, 400, false, false);

    const clearPath = useCallback(() => {
        setStarted(false);
        setTripsData([]);
        setTime(0);
        state.current.reset();
        waypoints.current = [];
        timer.current = 0;
        previousTimeRef.current = null;
        setAnimationEnded(false);
    }, []);

    const handleMapClick = useCallback(async (e, info) => {
        if (started && !animationEnded) return;

        setLoading(true);
        clearPath();

        const loadingHandle = setTimeout(() => {
            setLoading(true);
        }, 300);

        const node = await getNearestNode(e.coordinate[1], e.coordinate[0]);
        clearTimeout(loadingHandle);
        setLoading(false);

        if (!node) {
            ui.current.showSnack("No path was found in the vicinity, please try another location.");
            return;
        }

        if (info.rightButton) {
            setEndNode(node);
            state.current.endNode = state.current.getNode(node.id);
        } else {
            setStartNode(node);
            setEndNode(null);
            const circle = createGeoJSONCircle([node.lon, node.lat], settings.radius);
            setSelectionRadius([{ contour: circle }]);
            const graph = await getMapGraph(getBoundingBoxFromPolygon(circle), node.id);
            state.current.graph = graph;
        }
    }, [started, animationEnded, settings.radius, clearPath]);

    const startPathfinding = useCallback(() => {
        clearPath();
        state.current.start(settings.algorithm);
        setStarted(true);
    }, [clearPath, settings.algorithm]);

    const animateStep = useCallback((newTime) => {
        const updatedNodes = state.current.nextStep();
        updatedNodes.forEach((node) => updateWaypoints(node, node.referer));

        if (state.current.finished && !animationEnded) {
            // Handle finished state
            setAnimationEnded(true);
        }

        if (previousTimeRef.current != null) {
            const deltaTime = newTime - previousTimeRef.current;
            setTime(prevTime => (prevTime + deltaTime * playbackDirection));
        }

        previousTimeRef.current = newTime;
    }, [animationEnded, playbackDirection]);

    const animate = useCallback((newTime) => {
        for (let i = 0; i < settings.speed; i++) {
            animateStep(newTime);
        }
        requestRef.current = requestAnimationFrame(() => animate(newTime));
    }, [settings.speed, animateStep]);

    useEffect(() => {
        if (!started) return;
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [started, animate]);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(res => {
            setViewState({ ...viewState, longitude: res.coords.longitude, latitude: res.coords.latitude, zoom: 13 });
        });

        const storedSettings = localStorage.getItem("path_settings");
        if (storedSettings) {
            const items = JSON.parse(storedSettings);
            setSettings(items.settings);
            setColors(items.colors);
        }
    }, [viewState]);

    return (
        <>
            <div onContextMenu={(e) => e.preventDefault()}>
                <DeckGL
                    initialViewState={viewState}
                    controller={{ doubleClickZoom: false, keyboard: false }}
                    onClick={handleMapClick}
                >
                    {selectionRadius.length > 0 && (
                        <PolygonLayer
                            id={"selection-radius"}
                            data={selectionRadius}
                            pickable={true}
                            stroked={true}
                            getPolygon={d => d.contour}
                            getFillColor={[80, 210, 0, 10]}
                            getLineColor={[9, 142, 46, 175]}
                            getLineWidth={3}
                            opacity={selectionRadiusOpacity}
                        />
                    )}
                    {tripsData.length > 0 && (
                        <TripsLayer
                            id={"pathfinding-layer"}
                            data={tripsData}
                            opacity={1}
                            widthMinPixels={3}
                            widthMaxPixels={5}
                            currentTime={time}
                            getColor={d => colors[d.color]}
                        />
                    )}
                    <ScatterplotLayer
                        id="start-end-points"
                        data={[
                            ...(startNode ? [{ coordinates: [startNode.lon, startNode.lat], color: colors.startNodeFill, lineColor: colors.startNodeBorder }] : []),
                            ...(endNode ? [{ coordinates: [endNode.lon, endNode.lat], color: colors.endNodeFill, lineColor: colors.endNodeBorder }] : []),
                        ]}
                        pickable={true}
                        opacity={1}
                        filled={true}
                        radiusScale={1}
                        radiusMinPixels={7}
                        radiusMaxPixels={20}
                        getPosition={d => d.coordinates}
                        getFillColor={d => d.color}
                        getLineColor={d => d.lineColor}
                    />
                    <MapGL reuseMaps mapLib={maplibregl} mapStyle={MAP_STYLE} doubleClickZoom={false} />
                </DeckGL>
            </div>
            <Interface
                ref={ui}
                canStart={!!(startNode && endNode)}
                started={started}
                animationEnded={animationEnded}
                playbackOn={playbackOn}
                time={time}
                startPathfinding={startPathfinding}
                clearPath={clearPath}
                changeLocation={setViewState}
                maxTime={timer.current}
                settings={settings}
                changeSettings={setSettings}
                colors={colors}
                setColors={setColors}
                loading={loading}
            />
            <div className="attrib-container">
                <summary className="maplibregl-ctrl-attrib-button" title="Toggle attribution" aria-label="Toggle attribution"></summary>
                <div className="maplibregl-ctrl-attrib-inner">© <a href="https://carto.com/about-carto/" target="_blank" rel="noopener">CARTO</a>, © <a href="https://openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors</div>
            </div>
        </>
    );
}

export default Map;
