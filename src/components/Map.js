import { useState, useEffect, memo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker
} from 'react-simple-maps';
import styled from 'styled-components';
import { colors } from '../assets/globalStyles';
import Airtable from 'airtable';
import { csv, hierarchy, pack } from 'd3';
import countryCentroids from '../data/country_centroids.csv';
import stateCentroids from '../data/state_centroids.csv';

const geoUrl = "https://raw.githubusercontent.com/zcreativelabs/react-simple-maps/master/topojson-maps/world-110m.json";


const StyledDiv = styled.div`
  border-color: ${colors.gray};
  border: 1px;
`;

const StyledGeo = styled(Geography)`
  fill: none;
  stroke: ${colors.white};
  stroke-width: 0.25px;
`

const StyledCircle = styled.circle`
  r: 2.5;
  fill: ${colors.gray};
  stroke: ${colors.white};
  stroke-width: 1px;
  opacity: 0.8;
`;

const Map = ({ setTooltipContent }) => {
  // Getting Airtable data
  const [data, setData] = useState([]);
  const [centroids, setCentroids] = useState([]);
  const [states, setStates] = useState([]);

  useEffect(() => {
    const collectedRecords = [];
    const base = new Airtable({ apiKey: 'keywRM6loIt7lA1z5' }).base('appwVZRJnqecAwE8j');
    base('apps_merged')
      .select({ view: "Grid view" })
      .eachPage(
        (records, fetchNextPage) => {
          records.forEach(r => collectedRecords.push(r.fields))
          fetchNextPage();
        },
        err => {
          if (err) {
            console.error(err);
            return;
          }
          setData(collectedRecords);
        }
      );

    csv(countryCentroids).then(parsedData => setCentroids(parsedData));
    csv(stateCentroids).then(parsedData => setStates(parsedData))
  }, [])


  // Count number of markers per country
  const countryCounts = {};
  data.forEach(({ Country }) => countryCounts[Country] = (countryCounts[Country] || 0) + 1);

  let markerData;
  if (data && centroids && states) {
    markerData = data.map(d => {
      // Find country centroid
      const elemState = d.Country.match(/United States \(([a-zA-Z, ]+)\)/);
      let ctr;
      if (elemState) {
        ctr = states.find(e => e.state === elemState[1]);
      } else {
        ctr = centroids.find(e => e.name === d.Country);
      }
      const res = { ...d }
      if (ctr) {
        res.coordinates = [+ctr.Longitude, +ctr.Latitude];
      }
      return res;
    });
  }

  const packGenerator = pack().radius(() => 0.8).padding(1);

  Object.entries(countryCounts).forEach(([country, count], i) => {
    if (count > 1) {
      const countryApps = markerData.filter(({ Country }) => Country === country);
      const flatHierarchy = hierarchy({ children: countryApps }).count();
      const root = packGenerator(flatHierarchy);
      const packed = root.leaves()
      console.log(packed);

      // Offset each app's coordinates by the packed position
      console.log(countryApps);
      console.log(packed);
      countryApps.forEach((app, i) => {
        if (app.coordinates) {
          const offsetApp = packed[i];
          app.coordinates = [
            app.coordinates[0] + offsetApp.x - root.x,
            app.coordinates[1] + offsetApp.y - root.y
          ];
        }
      })
    }
  })

  const markers = markerData.map(({ Name, Country, coordinates }, i) => {
    if (coordinates) {
      return (
        <Marker
          key={`${Name}-${i}`}
          coordinates={coordinates}
          onMouseEnter={() => {
            setTooltipContent(`${Name} - ${Country}`);
          }}
          onMouseLeave={() => {
            setTooltipContent("");
          }}
        >
          <StyledCircle />
        </Marker>
      )
    } else { return null; }
  }).filter(d => d);

  return (
    <StyledDiv>
      <ComposableMap data-tip="" height={300}>
        <ZoomableGroup zoom={1}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map(geo => (
                <StyledGeo
                  key={geo.rsmKey}
                  geography={geo}
                />
              ))
            }
          </Geographies>
          <g className="markers">
            {markers}
          </g>
        </ZoomableGroup>
      </ComposableMap>
    </StyledDiv>
  )
};

export default memo(Map);