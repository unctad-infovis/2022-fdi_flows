import React, { useState, useEffect, useCallback } from 'react';
import '../styles/styles.less';

// https://www.highcharts.com/
import Highcharts from 'highcharts';
import highchartsAccessibility from 'highcharts/modules/accessibility';
import highchartsExporting from 'highcharts/modules/exporting';
import highchartsExportData from 'highcharts/modules/export-data';

// Load helpers.
import formatNr from './helpers/FormatNr.js';
import roundNr from './helpers/RoundNr.js';
import legendIcon from './helpers/LegendIcon.jsx';

highchartsAccessibility(Highcharts);
highchartsExporting(Highcharts);
highchartsExportData(Highcharts);

Highcharts.setOptions({
  lang: {
    decimalPoint: '.',
    downloadCSV: 'Download CSV data',
    thousandsSep: ','
  }
});
Highcharts.SVGRenderer.prototype.symbols.download = (x, y, w, h) => {
  const path = [
    // Arrow stem
    'M', x + w * 0.5, y,
    'L', x + w * 0.5, y + h * 0.7,
    // Arrow head
    'M', x + w * 0.3, y + h * 0.5,
    'L', x + w * 0.5, y + h * 0.7,
    'L', x + w * 0.7, y + h * 0.5,
    // Box
    'M', x, y + h * 0.9,
    'L', x, y + h,
    'L', x + w, y + h,
    'L', x + w, y + h * 0.9
  ];
  return path;
};

// https://stackoverflow.com/questions/63518108/highcharts-negative-logarithmic-scale-solution-stopped-working
// eslint-disable-next-line no-unused-expressions
((H) => {
  H.addEvent(H.Axis, 'afterInit', () => {
    const { logarithmic } = this;
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
        let result = 10 ** Math.abs(num);
        if (result < 10) {
          result = (10 * (result - 1)) / (10 - 1);
        }
        return isNegative ? -result : result;
      };
    }
  });
}, [Highcharts]);

Highcharts.setOptions({
  lang: {
    decimalPoint: '.',
    thousandsSep: ','
  }
});

// Define chart container.
let chart;
const start_year = 1990;
const end_year = 2021;
const years = (Array(end_year - start_year + 1).fill().map((_, idx) => start_year + idx));

function App() {
  // Data states.
  const [data, setData] = useState(false);
  const [activeData, setActiveData] = useState(false);
  const [dataType, setDataType] = useState('fdi_inflows');
  // Data selection states.
  const [selected, setSelected] = useState({ World: true });
  const [visible, setVisible] = useState({ World: true });
  const [legend, setLegend] = useState(false);
  // Not used.
  // const [relativeToPopulation, setRelativeToPopulation] = useState(false);

  // This is to clean data.
  const cleanData = useCallback((json_data) => {
    let current_level = 0;
    const parents = [];
    ['fdi_inflows', 'fdi_outflows'].map(type => {
      json_data[type] = json_data[type].map(area => {
        area.level = parseInt(area.level, 10);
        if (area.level < current_level) {
          while (area.level < current_level) {
            current_level--;
            parents.pop();
          }
          parents.push(area[['Region/economy']]);
        } else if (area.level >= current_level && area.type !== 'country') {
          parents.push(area[['Region/economy']]);
        }
        current_level = area.level;
        return {
          area_type: area.type,
          data: years.map((year) => parseFloat(area[year])),
          level: area.level,
          name: area['Region/economy'],
          parents: [...parents],
          showInLegend: (visible[area['Region/economy']] === true),
          visible: (visible[area['Region/economy']] === true)
        };
      });
      return false;
    });
    setActiveData(json_data[dataType]);
    return json_data;
  }, [dataType, visible]);

  useEffect(() => {
    const data_file = (window.location.href.includes('unctad.org')) ? 'https://storage.unctad.org/2022-fdi_flows/assets/data/data.json' : './assets/data/data.json';
    try {
      fetch(data_file)
        .then((response) => {
          if (!response.ok) {
            throw Error(response.statusText);
          }
          return response.text();
        })
        .then(body => setData(cleanData(JSON.parse(body))));
    } catch (error) {
      console.error(error);
    }
  }, [cleanData]);

  const createChart = useCallback(() => {
    chart = Highcharts.chart('highchart-container', {
      chart: {
        height: 440,
        marginTop: 40,
        events: {
          redraw() {
            // eslint-disable-next-line react/no-this-in-sfc
            this.series.forEach((series) => {
              series.userOptions.showInLegend = series.visible;
              series.showInLegend = series.visible;
            });
          }
        },
        resetZoomButton: {
          theme: {
            fill: '#fff',
            r: 0,
            states: {
              hover: {
                fill: '#009edb',
                stroke: 'transparent',
                style: {
                  color: '#fff'
                }
              }
            },
            stroke: '#7c7067',
            style: {
              fontFamily: 'Roboto',
              fontSize: 13,
              fontWeight: 400
            }
          }
        },
        style: {
          color: '#7c7067',
          fontFamily: 'Roboto',
          fontWeight: 400
        },
        zoomType: 'x'
      },
      colors: ['#009edb', '#72bf44', '#a066aa', '#ffcb05', '#aaa096', '#eb1f48'],
      credits: {
        enabled: false
      },
      exporting: {
        buttons: {
          contextButton: {
            text: 'Export',
            menuItems: ['viewFullscreen', 'separator', 'downloadPNG', 'downloadPDF', 'separator', 'downloadCSV'],
            symbol: 'download',
            symbolFill: '#000'
          }
        },
        chartOptions: {
          caption: {
            align: 'left',
            margin: 15,
            style: {
              color: 'rgba(0, 0, 0, 0.8)',
              fontSize: '14px'
            },
            text: '<em>Source:</em> UNCTAD World Investment Report 2022',
            verticalAlign: 'bottom',
            x: 0
          },
          chart: {
            events: {
              load() {
                // eslint-disable-next-line react/no-this-in-sfc
                this.renderer.image('https://unctad.org/sites/default/files/2022-11/unctad_logo.svg', 5, 15, 100, 100).add();
              }
            },
            marginTop: null,
            height: 600
          },
          legend: {
            enabled: true
          },
          subtitle: {
            align: 'left',
            enabled: true,
            style: {
              color: 'rgba(0, 0, 0, 0.8)',
              fontSize: '16px',
              fontWeight: 400,
              lineHeight: '18px'
            },
            text: 'By selected region or economy in selected time period',
            widthAdjust: -120,
            x: 100
          },
          title: {
            align: 'left',
            margin: 100,
            style: {
              color: '#000',
              fontSize: '30px',
              fontWeight: 700,
              lineHeight: '34px'
            },
            text: 'Foreign direct investment flows',
            widthAdjust: -120,
            x: 100
          }
        },
        filename: 'world_investment_report_2022_selected_fdi_flows'
      },
      legend: {
        align: 'left',
        enabled: false,
        itemStyle: {
          color: '#000',
          cursor: 'default',
          fontFamily: 'Roboto',
          fontSize: '14px',
          fontWeight: 400
        },
        layout: 'horizontal',
        margin: 0,
        verticalAlign: 'bottom'
      },
      title: {
        text: null
      },
      tooltip: {
        backgroundColor: '#fff',
        borderColor: '#ccc',
        borderRadius: 0,
        borderWidth: 1,
        crosshairs: true,
        formatter() {
          // eslint-disable-next-line react/no-this-in-sfc
          const values = this.points.map(point => [point.series.name, point.y, point.color]).sort((a, b) => (a[1] < b[1] ? 1 : -1));
          const rows = [];
          rows.push(values.map(point => `<div style="color: ${point[2]}"><span class="tooltip_label">${point[0]}:</span> <span class="tooltip_value">${formatNr(roundNr(point[1], 0), ',', ' million', '$')}</span></div>`).join(''));
          // eslint-disable-next-line react/no-this-in-sfc
          return `<div class="tooltip_container"><h3 class="tooltip_header">Year ${this.x}</h3>${rows}</div>`;
        },
        shadow: false,
        shared: true,
        style: {
          color: '#7c7067',
          fontFamily: 'Roboto',
          fontSize: 13,
          fontWeight: 400
        },
        useHTML: true
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
          pointStart: start_year,
          states: {
            hover: {
              halo: {
                size: 0
              },
              enabled: true,
              lineWidth: 2
            }
          }
        }
      },
      responsive: {
        rules: [{
          chartOptions: {
            legend: {
              align: 'center',
              layout: 'horizontal',
              verticalAlign: 'bottom'
            }
          },
          condition: {
            maxWidth: 500
          }
        }]
      },
      series: activeData,
      xAxis: {
        accessibility: {
          description: 'Year from 1990 to 2021'
        },
        allowDecimals: false,
        crosshair: {
          color: 'rgba(124, 112, 103, 0.2)',
          width: 1
        },
        labels: {
          rotation: 0,
          style: {
            color: '#7c7067',
            fontFamily: 'Roboto',
            fontSize: 13,
            fontWeight: 400
          },
          y: 20
        },
        lineColor: 'transparent',
        lineWidth: 0,
        opposite: false,
        plotLines: null,
        showFirstLabel: true,
        tickWidth: 0,
        title: {
          enabled: true,
          offset: 30,
          style: {
            color: '#7c7067',
            fontFamily: 'Roboto',
            fontSize: 13,
            fontWeight: 400
          },
          text: 'Year'
        }
      },
      yAxis: {
        accessibility: {
          description: 'Millions of dollars'
        },
        allowDecimals: true,
        custom: {
          allowNegativeLog: true
        },
        gridLineColor: 'rgba(124, 112, 103, 0.2)',
        gridLineDashStyle: 'shortdot',
        gridLineWidth: 1,
        labels: {
          style: {
            color: '#7c7067',
            fontFamily: 'Roboto',
            fontSize: 13,
            fontWeight: 400
          }
        },
        lineColor: 'transparent',
        lineWidth: 0,
        opposite: false,
        plotLines: [{
          color: 'rgba(124, 112, 103, 0.6)',
          value: 0,
          width: 1
        }],
        showFirstLabel: true,
        showLastLabel: true,
        title: {
          align: 'high',
          enabled: true,
          reserveSpace: false,
          rotation: 0,
          style: {
            color: '#7c7067',
            fontFamily: 'Roboto',
            fontSize: 13,
            fontWeight: 400
          },
          text: 'Millions of dollars',
          verticalAlign: 'top',
          x: 100,
          y: -25
        },
        type: 'linear'
      }
    });
  }, [activeData]);

  const toggleLegendItems = () => {
    setLegend(chart.series.filter((serie) => {
      if (serie.visible === true) {
        return {
          color: serie.color,
          name: serie.name,
          symbol: serie.symbol
        };
      }
      return false;
    }));
  };

  // Change active data.
  useEffect(() => {
    if (activeData !== undefined && activeData !== false) {
      if (!chart) {
        createChart();
        toggleLegendItems();
      }
    }
  }, [activeData, createChart]);

  // Change data type.
  useEffect(() => {
    setActiveData(data[dataType]);
    if (chart) {
      while (chart.series.length > 0) {
        chart.series[0].remove(false);
      }
      data[dataType].map(el => {
        el.visible = (selected[el.name] === true);
        el.showInLegend = (selected[el.name] === true);
        chart.addSeries(el, false);
        return true;
      });
      toggleLegendItems();
      chart.redraw();
    }
  }, [data, dataType, selected]);

  const analytics = window.gtag || undefined;
  const track = useCallback((label_event = false, value_event = false) => {
    if (typeof analytics !== 'undefined' && label_event !== false && value_event !== false) {
      analytics('event', 'project_interaction', {
        label: label_event,
        project_name: '2022-fdi_flows',
        transport_type: 'beacon',
        value: value_event
      });
    }
  }, [analytics]);

  // This is to toggle checkboxes and to toggle data.
  const chooseActiveData = (area) => {
    chart.series.map((serie, i) => {
      if (serie.name === area.name) {
        chart.series[i].setVisible(!selected[area.name], false);
      }
      return true;
    });
    selected[area.name] = !selected[area.name];
    setSelected(selected);
    toggleLegendItems();
    chart.redraw();

    track('Choose country', area.name);
  };

  // This is to change data type.
  const changeDataType = (event, type) => {
    const elements = document.getElementsByClassName('data_type');
    for (let i = 0, all = elements.length; i < all; i++) {
      elements[i].classList.remove('selected');
    }
    event.target.classList.add('selected');
    setDataType(type);

    track('Choose Data Type', type);
  };

  // This is to toggle linear or logarithmic scale.
  const toggleLinearLogarithmicScale = (event, type) => {
    chart.yAxis[0].update({
      type
    });
    const elements = document.getElementsByClassName('linearlogarithmic');
    for (let i = 0, all = elements.length; i < all; i++) {
      elements[i].classList.remove('selected');
    }
    event.target.classList.add('selected');

    track('Toggle Scale', type);
  };

  const search = (event) => {
    const visible_tmp = {};
    activeData.map(area => {
      if (event.target.value === '') {
        visible_tmp[area.name] = true;
      } else if (area.name.toLowerCase().includes(event.target.value.toLowerCase()) === true) {
        visible_tmp[area.name] = true;
        area.parents.map((parent) => {
          visible_tmp[parent] = true;
          return true;
        });
      } else {
        visible_tmp[area.name] = false;
      }
      return true;
    });
    setVisible(visible_tmp);
  };

  // Not used.
  // const toggleRelativeToPopulation = () => {
  //   setRelativeToPopulation(!relativeToPopulation);
  // }

  return (
    <div className="app">
      <div className="layout">
        {
          // Left
        }
        <div className="left_container">
          {
            // Name
          }
          <div className="name_container">
            <h3>FDI Data Explorer</h3>
          </div>
          {
            // Country selection
          }
          <div className="country_selection_container">
            <h4>Select a country or region</h4>
            <div className="search_container"><input type="text" placeholder="Type to search" onChange={(event) => search(event)} /></div>
            <ul className="selection_list">
              {
                // Create only when data is ready.
                activeData && activeData.map((area, i) => (
                  <li key={area.name} style={{ marginLeft: `${(area.level - 1) * 7}px` }}>
                    <label style={{ display: ((visible[area.name] === true || visible[area.name] === undefined) ? 'block' : 'none'), fontWeight: (area.area_type === 'region') ? 700 : 400 }} title={`Toggle ${area.name} in the chart`} aria-label={`Toggle ${area.name} in the chart`} htmlFor={`country_${i}`}>
                      <span className="input_container">
                        <input type="checkbox" value={area.name} checked={(selected[area.name] === true)} id={`country_${i}`} onChange={() => chooseActiveData(area)} />
                      </span>
                      <span className="label_container">{area.name}</span>
                    </label>
                  </li>
                ))
              }
            </ul>
          </div>
        </div>
        {
          // Right
        }
        <div className="right_container">
          {
            // Title
          }
          <div className="title_container">
            <h3>By region and economy, 1990–2021</h3>
            <div className="options_container">
              {
                // <label style={{display: 'none'}}>
                //   <span className={'input_container'}>
                //     <input type="checkbox" value={relativeToPopulation} selected={relativeToPopulation} onChange={() => toggleRelativeToPopulation()} />
                //   </span>
                //   <span className={'label_container'}>Relative to Population</span>
                // </label>
              }
              <span className="input_container">
                <button onClick={(event) => toggleLinearLogarithmicScale(event, 'linear')} className="linearlogarithmic selected" title="Use linear scale on y-axis" aria-label="Use linear scale on y-axis" type="button">Linear</button>
              </span>
              <span className="input_container">
                <button onClick={(event) => toggleLinearLogarithmicScale(event, 'logarithmic')} className="linearlogarithmic" title="Use logarithmic scale on y-axis" aria-label="Use logarithmic scale on y-axis" type="button">Log</button>
              </span>
              <span className="button_group" />
              <span className="input_container">
                <button onClick={(event) => changeDataType(event, 'fdi_inflows')} className="data_type selected" title="Select FDI inflows dataset" aria-label="Select FDI inflows dataset" type="button">Inflows</button>
              </span>
              <span className="input_container">
                <button onClick={(event) => changeDataType(event, 'fdi_outflows')} className="data_type" title="Select FDI outflows dataset" aria-label="Select FDI outflows dataset" type="button">Outflows</button>
              </span>
            </div>
          </div>
          <div className="chart_container">
            <div className="info" style={{ display: Object.values(selected).reduce((a, item) => a + item, 0) > 0 ? 'none' : 'flex' }}><h3>Select at least one country or region from the left</h3></div>
            <div className="highchart_container" id="highchart-container" style={{ display: Object.values(selected).reduce((a, item) => a + item, 0) > 0 ? 'block' : 'none' }} />
            <img src="//unctad.org/sites/default/files/2022-11/unctad_logo.svg" alt="UNCTAD logo" className="unctad_logo" />
            <div className="legend_container">
              {
                legend && legend.map(legend_item => (
                  <button key={legend_item.name} style={{ color: legend_item.color }} onClick={() => chooseActiveData(legend_item)} title={`Remove ${legend_item.name} from the chart`} aria-label={`Remove ${legend_item.name} from the chart`} type="button">
                    {legendIcon(legend_item.symbol, legend_item.color)}
                    {legend_item.name}
                  </button>
                ))
              }
            </div>
            <div className="source_container">
              <em>Source:</em>
              {' '}
              <a href="//unctad.org/topic/investment/world-investment-report" target="_blank" rel="noreferrer">UNCTAD World Investment Report 2022</a>
            </div>
          </div>
        </div>
      </div>
      <noscript>Your browser does not support JavaScript!</noscript>
    </div>
  );
}

export default App;
