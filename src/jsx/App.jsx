import React, { useState, useEffect, useRef } from 'react';
import style from './../styles/styles.less';

// https://d3js.org/
import * as d3 from 'd3';

// https://www.highcharts.com/
import Highcharts from 'highcharts';

// Load helpers.
import formatNr from './helpers/formatNr.jsx';
import roundNr from './helpers/roundNr.jsx';

// https://stackoverflow.com/questions/63518108/highcharts-negative-logarithmic-scale-solution-stopped-working
(function (H) {
  H.addEvent(H.Axis, 'afterInit', function () {
    const logarithmic = this.logarithmic;
    if (logarithmic && this.options.custom.allowNegativeLog) {
      // Avoid errors on negative numbers on a log axis
      this.positiveValuesOnly = false;
      // Override the converter functions
      logarithmic.log2lin = num => {
        const isNegative = num < 0;
        let adjustedNum = Math.abs(num);
        if (adjustedNum < 10) {
          adjustedNum += (10 - adjustedNum) / 10;
        }
        const result = Math.log(adjustedNum) / Math.LN10;
        return isNegative ? -result : result;
      };
      logarithmic.lin2log = num => {
        const isNegative = num < 0;
        let result = Math.pow(10, Math.abs(num));
        if (result < 10) {
          result = (10 * (result - 1)) / (10 - 1);
        }
        return isNegative ? -result : result;
      };
    }
  });
}(Highcharts));

// Define chart container.
let chart;
const start_year = 1990;
const end_year = 2021;
const years = (Array(end_year - start_year + 1).fill().map((_, idx) => start_year + idx));
const enabled = []

const App = () => {
  const [data, setData] = useState(false);
  const [checked, setChecked] = useState([]);
  const [relativeToPopulation, setRelativeToPopulation] = useState(false);
  const [legend, setLegend] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    d3.json('./data/data2020.json').then((json_data) => {
      setChecked(json_data.fdi_data.map((area, i) => {
        return ((area.visible === true) ? true : false);
      }));
      setData(cleanData(json_data.fdi_data));
    });
  }, []);

  // Create the chart when data is set.
  useEffect(() => {
    if (data !== false) {
      createChart();
      toggleData(0);
    }
  }, [data]);

  const cleanData = (data) => {
    data = data.map((area, i) => {
      return {
        data: years.map((year) => parseFloat(area[year])),
        level: parseInt(area.level),
        name: area['Region/economy'],
        visible: (i === 0) ? true : false
      }
    });
    return data;
  };

  // This is to toggle checkboxes and to toggle data.
  const toggleData = (i) => {
    chart.series[i].setVisible(!checked[i], false);
    checked[i] = !checked[i];
    setChecked([...checked]);

    setLegend(chart.series.filter((serie) => {
      if (serie.visible === true) {
        return {
          color: serie.color,
          name: serie.name,
          symbol: serie.symbol
        }
      }
    }));
    chart.redraw();
  };

  // This is to toggle linear or logarithmic scale.
  const toggleLinearLogarithmic = (type) => {
    chart.yAxis[0].update({
      type: type
    });
    let elements = document.getElementsByTagName('button');
    for (var i = 0, all = elements.length; i < all; i++) { 
      elements[i].classList.remove(style.selected);
    }
    event.target.classList.add(style.selected);
  }

  const search = () => {
    setSearchTerm(event.target.value)
  }
  const toggleListItem = (search_term, area) => {
    if (search_term === '') {
      return 'block';
    }
    return (area.toLowerCase().includes(search_term.toLowerCase()) === false) ? 'none' : 'block'; 
  }

  // Not used.
  const toggleRelativeToPopulation = () => {
    setRelativeToPopulation(!relativeToPopulation);
  }

  // This is to draw the legend icon.
  const legendIcon = (symbol, color) => {
    if (symbol === 'square') {
      return (<svg><path fill="none" d="M 0 11 L 16 11" stroke={color} strokeWidth="2"></path><path fill={color} d="M 4 7 L 12 7 L 12 15 L 4 15 Z" opacity="1"></path></svg>);
    }
    else if (symbol === 'circle') {
      return (<svg><path fill="none" d="M 0 11 L 16 11" stroke={color} strokeWidth="2"></path><path fill={color} d="M 8 15 A 4 4 0 1 1 8.003999999333336 14.999998000000167 Z" opacity="1"></path></svg>);
    }
    else if (symbol === 'diamond') {
      return (<svg><path fill="none" d="M 0 11 L 16 11" stroke={color} strokeWidth="2"></path><path fill={color} d="M 8 7 L 12 11 L 8 15 L 4 11 Z" opacity="1"></path></svg>);
    }
    else if (symbol === 'triangle-down') {
      return (<svg><path fill="none" d="M 0 11 L 16 11" stroke={color} strokeWidth="2"></path><path fill={color} d="M 4 7 L 12 7 L 8 15 Z" opacity="1"></path></svg>);
    }
    else if (symbol === 'triangle') {
      return (<svg><path fill="none" d="M 0 11 L 16 11" stroke={color} strokeWidth="2"></path><path fill={color} d="M 8 7 L 12 15 L 4 15 Z" opacity="1"></path></svg>);
    }
  }

  const createChart = () => {
    chart = Highcharts.chart('highchart-container', {
      chart: {
        height: 440,
        resetZoomButton: {
          theme: {
            style: {
              fontFamily: 'Roboto',
              fontSize: 14,
              fontWeight: 'normal',
            },
            fill: '#fff',
            r: 0,
            states: {
              hover: {
                fill: '#0077b8',
                stroke: 'transparent',
                style: {
                  color: '#fff',
                }
              }
            },
            stroke: '#7c7067'
          },
        },
        style: {
          color: '#7c7067',
          fontFamily: 'Roboto',
          fontSize: 16,
          fontWeight: 'normal'
        },
        zoomType: 'x',
      },
      credits: {
        enabled: false,
      },
      legend: {
        enabled: false,
      },
      title: {
        text: null
      },
      yAxis: {
        allowDecimals: true,
        gridLineColor: 'rgba(124, 112, 103, 0.2)',
        gridLineWidth: 1,
        gridLineDashStyle: 'shortdot',
        labels: {
          style: {
            color: '#7c7067',
            fontFamily: 'Roboto',
            fontSize: 12,
            fontWeight: 'normal',
          }
        },
        lineColor: 'transparent',
        lineWidth: 0,
        opposite: false,
        showLastLabel: true,
        custom: {
          allowNegativeLog: true
        },
        showFirstLabel: true,
        type: 'linear',
        title: {
          align: 'high',
          enabled: true,
          reserveSpace: false,
          rotation: 0,
          style: {
            color: '#7c7067',
            fontFamily: 'Roboto',
            fontSize: 10,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            fontWeight: 'normal'
          },
          text: 'Millions of dollars',
          verticalAlign:'top',
          x: 170,
          y: -2,
        },
      },
      xAxis: {
        allowDecimals: false,
        categories: years,
        labels: {
          style: {
            color: '#7c7067',
            fontFamily: 'Roboto',
            fontWeight: 'normal',
            fontSize: 12,
          },
          y: 20
        },
        lineColor: 'transparent',
        lineWidth: 0,
        opposite: false,
        plotLines: null,
        showFirstLabel: true,
        crosshair: {
          color: 'rgba(124, 112, 103, 0.2)',
          width: 1
        },
        tickWidth: 0,
        title: {
          enabled: true,
          offset: 50,
          style: {
            color: '#7c7067',
            fontFamily: 'Roboto',
            fontSize: 10,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            fontWeight: 'normal'
          },
          text: 'Year',
        },
      },
      tooltip: {
        backgroundColor: '#fff',
        borderColor: '#ccc',
        borderRadius: 0,
        crosshairs: true,
        borderWidth: 1,
        formatter: function () {
          const values = this.points.map((point, i) => {
            return [point.series.name, point.y, point.color];
          })
          values.sort((a, b) => (a[1] < b[1] ? 1 : -1));
          let html = '<div class="' + style.tooltip_container + '"><h3 class="' + style.tooltip_header + '">Year ' + this.x + '</h3>';
          const rows = [];
          rows.push(values.map((point, i) => {
            return '<div style="color: ' + point[2] + '"><span class="' + style.tooltip_label + '">' + point[0] + ':</span> <span class="' + style.tooltip_value + '">' + formatNr(roundNr(point[1], 0), ',', ' million', '$') + '</span></div>';
          }).join(''));
          html = html + rows;
          return html;
        },
        shadow: false,
        shared: true,
        style: {
          color: '#7c7067',
          fontFamily: 'Roboto',
          fontSize: 12,
          fontWeight: 'normal',
        },
        useHTML: true,
      },
      legend: {
        align: 'center',
        enabled: false,
        layout: 'horizontal',
        verticalAlign: 'middle'
      },
      plotOptions: {
        line: {
          cursor: 'pointer',
          lineWidth: 2,
          marker: {
            enabled: true,
            radius: 0,
            states: {
              hover: {
                animation: false,
                enabled: true,
                radius: 8
              }
            },
            symbol: 'circle'
          },
          states: {
            hover: {
              halo: {
                size: 0
              },
              enabled: true,
              lineWidth: 2
            }
          }
        },
      },
      series: data,
      responsive: {
        rules: [{
          condition: {
            maxWidth: 500
          },
          chartOptions: {
            legend: {
              layout: 'horizontal',
              align: 'center',
              verticalAlign: 'bottom'
            }
          }
        }]
      }
    });
  };

  // shouldComponentUpdate(nextProps, nextState) {}
  // static getDerivedStateFromProps(props, state) {}
  // getSnapshotBeforeUpdate(prevProps, prevState) {}
  // static getDerivedStateFromError(error) {}
  // componentDidCatch() {}

  return (
    <div className={style.app}>
      <div className={style.layout}>
        {
          // Left
        }
        <div className={style.left + ' ' + style.container}>
          {
            // Name
          }
          <div className={style.name_container}>
            <h3>FDI Inflows Data Explorer</h3>
          </div>
          {
            // Country selection
          }
          <div className={style.country_selection_container}>
            <h4>Select a country or region</h4>
            <div className={style.search_container}><input type="text" placeholder="Type to search" onChange={() => search()} /></div>
            <ul className={style.selection_list}>
              {
                // Create only when data is ready.
                data && data.map((area, i) => {
                  return (
                    <li key={i} style={{marginLeft: ((area.level - 1) * 5) + 'px'}}>
                      <label style={{display: toggleListItem(searchTerm, area.name)}}>
                        <span className={style.input_container}>
                          <input type="checkbox" value={area.name} checked={checked[i]} onChange={() => toggleData(i)} />
                        </span>
                        <span className={style.label_container}>{area.name}</span>
                      </label>
                    </li>
                  );
                })
              }
            </ul>
          </div>
        </div>
        {
          // Right
        }
        <div className={style.right + ' ' + style.container}>
          {
            // Title
          }
          <div className={style.title_container}>
            <h3>By region and economy, 1990–2021</h3>
            <div className={style.options_container}>
              <label style={{display: 'none'}}>
                <span className={style.input_container}>
                  <input type="checkbox" value={relativeToPopulation} checked={relativeToPopulation} onChange={() => toggleRelativeToPopulation()} />
                </span>
                <span className={style.label_container}>Relative to Population</span>
              </label>
              <span className={style.input_container}>
                <button onClick={() => toggleLinearLogarithmic('linear')} className={style.selected}>Linear</button>
              </span>
              <span className={style.input_container}>
                <button onClick={() => toggleLinearLogarithmic('logarithmic')}>Log</button>
              </span>
            </div>
          </div>
          {
            // Chart
          }
          <div className={style.chart_container + ' ' + style.container}>
            <div className={style.highchart_container} id="highchart-container"></div>
            <div className={style.legend_container}>
              {
                legend && legend.map((legend_item, i) => {
                  return (<span key={i} style={{color:legend_item.color}}>{legendIcon(legend_item.symbol, legend_item.color)} {legend_item.name}</span>)
                })
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

