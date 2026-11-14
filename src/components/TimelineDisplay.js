import styled from '@emotion/styled';
import Timeline from './Timeline';
import TimeScale from './TimeScale';
import canonicalData from '../data/canonicalData';
import { addEventsToSystems, groupEventsBySystem } from '../utils/dataUtils';
import { useRef, useState } from 'react';
import useDebouncedState from '../hooks/useDebouncedState';
import { Slider } from '@mui/material';
import TimelineSvg from './TimelineSvg';

const MIN_YEAR = -1100;
const MAX_YEAR = 16050;
const marks = [
  { value: MIN_YEAR, label: MIN_YEAR },
  { value: 0, label: '0' },
  { value: 2000, label: '2000' },
  { value: 4000, label: '4000' },
  { value: 6000, label: '6000' },
  { value: 8000, label: '8000' },
  { value: 10000, label: '10000' },
  { value: 12000, label: '12000' },
  { value: 14000, label: '14000' },
  { value: MAX_YEAR, label: MAX_YEAR },
];

const systemsWithEvents = addEventsToSystems(
  canonicalData.systems,
  groupEventsBySystem(canonicalData.events)
);

function TimelineDisplay() {
  const containerRef = useRef(null);
  const [minInput, setMinInput] = useState(MIN_YEAR);
  const [maxInput, setMaxInput] = useState(MAX_YEAR);
  const [minYear, setMinYear] = useDebouncedState(MIN_YEAR, 500);
  const [maxYear, setMaxYear] = useDebouncedState(MAX_YEAR, 500);

  const [activeLines, setActiveLines] = useState(
    Object.keys(systemsWithEvents)
  );

  const handleMinYearChange = (e) => {
    const value = Math.max(e.target.value, MIN_YEAR);
    setMinInput(value);
    setMinYear(value);
  };
  const handleMaxYearChange = (e) => {
    const value = Math.min(e.target.value, MAX_YEAR);
    setMaxInput(value);
    setMaxYear(value);
  };

  const toggleActive = (system) => {
    setActiveLines((prev) => {
      if (prev.includes(system)) {
        return prev.filter((s) => s !== system);
      } else {
        return [...prev, system];
      }
    });
  };

  const handleSliderChange = (e, newValue) => {
    setMinYear(newValue[0]);
    setMinInput(newValue[0]);
    setMaxYear(newValue[1]);
    setMaxInput(newValue[1]);
  };

  const timelines = Object.keys(systemsWithEvents);

  return (
    <Container ref={containerRef}>
      <div className="timeline-buttons">
        {timelines.map((system) => (
          <SystemButton
            key={system}
            className={activeLines.includes(system) ? 'active' : 'inactive'}
            $color={systemsWithEvents[system]?.color}
            onClick={() => toggleActive(system)}
          >
            {system}
          </SystemButton>
        ))}
      </div>

      <div
        className="year-slider"
        style={{ marginTop: '30px', padding: '20px 130px' }}
      >
        <Slider
          getAriaLabel={() => 'Year range'}
          label="Year Range"
          min={MIN_YEAR}
          max={MAX_YEAR}
          marks={marks}
          value={[minYear, maxYear]}
          onChange={handleSliderChange}
          valueLabelDisplay="on"
          sx={{
            '& .MuiSlider-valueLabel': { color: 'white' },
            '& .MuiSlider-markLabel': { color: 'white' },
          }}
        />
      </div>
      <YearSelect className="year-select">
        <div className="year-input">
          <label htmlFor="start-year">Start Year</label>
          <input
            id="start-year"
            type="number"
            value={minInput}
            onChange={handleMinYearChange}
          />
        </div>
        <div className="year-input">
          <label htmlFor="end-year">End Year</label>
          <input
            id="end-year"
            type="number"
            value={maxInput}
            onChange={handleMaxYearChange}
          />
        </div>
      </YearSelect>
      <TimeScale min={minYear} max={maxYear} />

      <svg
        width="100%"
        height="50%"
        viewBox={`0 0 1000 ${timelines.length * 28}`}
      >
        {timelines.map((system, index) => (
          <TimelineSvg
            key={system}
            index={index}
            system={systemsWithEvents[system]}
            min={minYear}
            max={maxYear}
            active={activeLines.includes(system)}
          />
        ))}
      </svg>
      <TimeScale min={minYear} max={maxYear} />
      {timelines.map((system) => (
        <Timeline
          key={system}
          system={systemsWithEvents[system]}
          min={minYear}
          max={maxYear}
          active={activeLines.includes(system)}
        />
      ))}
    </Container>
  );
}

const Container = styled.div`
  width: 100%;
  border: 1px solid #555;
  padding: 20px;
`;

const YearSelect = styled.div`
  display: flex;
  justify-content: space-around;
  padding: 10px;

  .year-input {
    border: 1px solid #555;
    border-radius: 8px;
    padding: 20px;
    font-size: 20px;

    label {
      font-weight: bold;
      margin-right: 10px;
    }
    input {
      width: 100px;
      background-color: transparent;
      color: white;
      border: none;
      font-size: 20px;
      text-align: center;
      border-bottom: 1px solid white;
    }
  }
`;

const SystemButton = styled.button`
  padding: 5px 10px;
  margin: 10px;
  background-color: #222;
  color: black;
  /* text-shadow: 1px 1px 2px white; */
  border-radius: 50px;
  cursor: pointer;
  background-color: ${(props) => props.$color || 'white'};
  font-weight: 800;
  font-size: 20px;
  opacity: 0.85;
  transition: all 0.25s ease;

  &.active {
    border: 3px solid red;
  }
  &.inactive {
    opacity: 0.3;
  }
  &:hover {
    opacity: 1;
    transform: scale(1.07);
  }
`;

export default TimelineDisplay;
