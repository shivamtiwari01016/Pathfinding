import Slider from "@mui/material/Slider";
import { alpha, styled } from "@mui/material/styles";

const successColor = "#46B780";
const successShadow = alpha(successColor, 0.16);

const SuccessSlider = styled(Slider)(() => ({
    color: successColor,
    "& .MuiSlider-thumb": {
        "&:hover, &.Mui-focusVisible": {
            boxShadow: `0px 0px 0px 8px ${successShadow}`,
        },
        "&.Mui-active": {
            boxShadow: `0px 0px 0px 14px ${successShadow}`,
        },
    },
    "& .MuiSlider-rail": {
        color: "#A8AFB3",
        opacity: 1
    },
}));

export default function StyledCustomization({ 
    disabled, value, min, max, step, onInput, onChange, onChangeCommitted, defaultValue, marks, style 
}) {
    return (
        <SuccessSlider 
            disabled={disabled} 
            value={value} 
            min={min} 
            max={max} 
            step={step} 
            onInput={onInput} 
            onChange={onChange} 
            onChangeCommitted={onChangeCommitted} 
            defaultValue={defaultValue} 
            marks={marks} 
            style={style} 
        />
    );
}
