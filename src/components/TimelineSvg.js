import { getEventPointYear } from '../utils/dataUtils';

// TODO: design collapse for when not active with animation

function TimelineSvg(props) {
  const { system, min, max, index } = props;
  const { color, events } = system;
  const filteredEvents =
    events?.filter((event) => {
      const year = getEventPointYear(event);
      return year != null && year >= min && year <= max;
    }) ?? [];

  return (
    <g transform={`translate(0, ${index * 25})`}>
      <text
        x="6%"
        y="11"
        fill={color}
        textAnchor="end"
        style={{
          textShadow: '1.5px 1.5px 3px black',
          fontSize: '11px',
          fontWeight: 'bold',
        }}
      >
        {system.name}
      </text>
      <line x1="7%" y1="8" x2="93%" y2="8" stroke={color} />
      {filteredEvents.map((event, i) => (
        <circle
          key={i}
          cx={`${7 + ((getEventPointYear(event) - min) / (max - min)) * 86}%`}
          cy="8"
          r="3"
          fill={color}
          stroke="white"
          strokeWidth=".25"
        />
      ))}

      <text
        x="94%"
        y="11"
        fill={color}
        style={{
          textShadow: '1.5px 1.5px 3px black',
          fontSize: '11px',
          fontWeight: 'bold',
        }}
      >
        {system.name}
      </text>
    </g>
  );
}

export default TimelineSvg;
