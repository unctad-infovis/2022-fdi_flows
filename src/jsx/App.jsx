import React, { useState, useEffect } from 'react';
import './../styles/styles.less';

// https://www.highcharts.com/
import Highcharts from 'highcharts';
import highchartsAccessibility from 'highcharts/modules/accessibility';
highchartsAccessibility(Highcharts);
import highchartsExporting from 'highcharts/modules/exporting';
highchartsExporting(Highcharts);

// Load helpers.
import formatNr from './helpers/formatNr.js';
import roundNr from './helpers/roundNr.js';
import legendIcon from './helpers/LegendIcon.jsx';

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
const enabled = []

const App = () => {
  // Data states.
  const [data, setData] = useState(false);
  const [activeData, setActiveData] = useState(false);
  const [dataType, setDataType] = useState('fdi_inflows');
  // Data selection states.
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState({'World': true});
  const [visible, setVisible] = useState({'World': true});
  const [legend, setLegend] = useState(false);
  // Not used.
  // const [relativeToPopulation, setRelativeToPopulation] = useState(false);

  useEffect(() => {
    const data_file = (window.location.href.includes('unctad.org')) ? '/sites/default/files/data-file/2022-fdi_flows.json' : './assets/data/data2021.json';
    try {
      fetch(data_file)
        .then(response => response.text())
        .then(body => setData(cleanData(JSON.parse(body))));
    }
    catch (error) {
      console.error(error);
    }
  }, []);

  // This is to clean data.
  const cleanData = (data) => {
    let current_level = 0;
    let parents = [];
    ['fdi_inflows', 'fdi_outflows'].map((type) => {
      data[type] = data[type].map((area, i) => {
        area.level = parseInt(area.level);
        if (area.level < current_level) {
          while (area.level < current_level) {
            current_level--;
            parents.pop();
          }
          parents.push(area[['Region/economy']]);
        }
        else if (area.level >= current_level && area.type !== 'country') {
          parents.push(area[['Region/economy']]);
        }
        current_level = area.level;
        return {
          area_type: area.type,
          data: years.map((year) => parseFloat(area[year])),
          level: area.level,
          name: area['Region/economy'],
          parents: [...parents],
          visible: (visible[area['Region/economy']] === true) ? true : false
        }
      });
    })
    setActiveData(data[dataType]);
    return data;
  };

  // Change active data.
  useEffect(() => {
    if (activeData !== undefined && activeData !== false) {
      if (!chart) {
        createChart();
        toggleLegendItems();
      }
    }
  }, [activeData]);

  // Change data type.
  useEffect(() => {
    setActiveData(data[dataType]);
    if (chart) {
      while (chart.series.length > 0) {
        chart.series[0].remove(false);
      }
      data[dataType].map((data) => {
        data.visible = (selected[data.name] === true) ? true : false;
        chart.addSeries(data, false);
      });
      toggleLegendItems();
      chart.redraw();
    }
  }, [dataType]);

  // This is to toggle checkboxes and to toggle data.
  const chooseActiveData = (area) => {
    chart.series.map((serie, i) => {
      if (serie.name === area.name) {
        chart.series[i].setVisible(!selected[area.name], false);
      }
    });
    selected[area.name] = !selected[area.name];
    setSelected(selected);
    toggleLegendItems();
    chart.redraw();

    if (typeof ga !== 'undefined' && selected[area.name]) {
      // ga('send', 'event', [eventCategory], [eventAction], [eventLabel], [eventValue], [fieldsObject]);
      ga('send', 'event', '2021-fdi_flows', 'click', 'chooseCountry', area.name);
    }
  };

  // This is to change data type.
  const changeDataType = (type) => {
    let elements = document.getElementsByClassName('data_type');
    for (var i = 0, all = elements.length; i < all; i++) { 
      elements[i].classList.remove('selected');
    }
    event.target.classList.add('selected');
    setDataType(type);

    if (typeof ga !== 'undefined') {
      // ga('send', 'event', [eventCategory], [eventAction], [eventLabel], [eventValue], [fieldsObject]);
      ga('send', 'event', '2021-fdi_flows', 'click', 'chooseDataType', type);
    }
  }

  const toggleLegendItems = () => {
    setLegend(chart.series.filter((serie) => {
      if (serie.visible === true) {
        return {
          color: serie.color,
          name: serie.name,
          symbol: serie.symbol
        }
      }
    }));
  }

  // This is to toggle linear or logarithmic scale.
  const toggleLinearLogarithmicScale = (type) => {
    chart.yAxis[0].update({
      type: type
    });
    let elements = document.getElementsByClassName('linearlogarithmic');
    for (var i = 0, all = elements.length; i < all; i++) { 
      elements[i].classList.remove('selected');
    }
    event.target.classList.add('selected');

    if (typeof ga !== 'undefined') {
      // ga('send', 'event', [eventCategory], [eventAction], [eventLabel], [eventValue], [fieldsObject]);
      ga('send', 'event', '2021-fdi_flows', 'click', 'toggleScale', type);
    }
  }

  const search = () => {
    activeData.map((area, i) => {
      if (event.target.value === '') {
        visible[area.name] = true;
      }
      else if (area.name.toLowerCase().includes(event.target.value.toLowerCase()) === true) {
        visible[area.name] = true;
        area.parents.map((parent) => {
          visible[parent] = true;
        });
      }
      else {
        visible[area.name] = false;
      }
    });
    setVisible(visible);
    setSearchTerm(event.target.value);
  }

  // Not used.
  // const toggleRelativeToPopulation = () => {
  //   setRelativeToPopulation(!relativeToPopulation);
  // }

  // This is to draw the legend icon.
  const createChart = () => {
    chart = Highcharts.chart('highchart-container', {
      chart: {
        height: 440,
        marginTop: [40],
        resetZoomButton: {
          theme: {
            fill: '#fff',
            r: 0,
            states: {
              hover: {
                fill: '#0077b8',
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
      colors: ['#0077b8', '#ab1d37', '#005392', '#eb0045', '#9a58af', '#27833a', '#733d96', '#7c7067'],
      credits: {
        enabled: false
      },
      exporting: {
        chartOptions: {
          legend: {
            enabled: true
          }
        }
      },
      legend: {
        enabled: false
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
        formatter: function () {
          const values = this.points.map((point, i) => [point.series.name, point.y, point.color]).sort((a, b) => (a[1] < b[1] ? 1 : -1));
          const rows = [];
          rows.push(values.map((point, i) => '<div style="color: ' + point[2] + '"><span class="' + 'tooltip_label' + '">' + point[0] + ':</span> <span class="' + 'tooltip_value' + '">' + formatNr(roundNr(point[1], 0), ',', ' million', '$') + '</span></div>').join(''));
          return '<div class="' + 'tooltip_container' + '"><h3 class="' + 'tooltip_header' + '">Year ' + this.x + '</h3>' + rows;
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
          states: {
            hover: {
              halo: {
                size: 0
              },
              enabled: true,
              lineWidth: 2
            }
          },
          pointStart: start_year
        }
      },
      responsive: {
        rules: [{
          condition: {
            maxWidth: 500
          },
          chartOptions: {
            legend: {
              align: 'center',
              layout: 'horizontal',
              verticalAlign: 'bottom'
            }
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
        gridLineWidth: 1,
        gridLineDashStyle: 'shortdot',
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
        showLastLabel: true,
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
            fontSize: 13,
            fontWeight: 400
          },
          text: 'Millions of dollars',
          verticalAlign:'top',
          x: 94,
          y: -25
        },
      }
    });
  };

  return (
    <div className={'app'}>
      <div className={'layout'}>
        {
          // Left
        }
        <div className={'left' + ' ' + 'container'}>
          {
            // Name
          }
          <div className={'name_container'}>
            <h3>FDI Data Explorer</h3>
          </div>
          {
            // Country selection
          }
          <div className={'country_selection_container'}>
            <h4>Select a country or region</h4>
            <div className={'search_container'}><input type="text" placeholder="Type to search" onChange={() => search()} /></div>
            <ul className={'selection_list'}>
              {
                // Create only when data is ready.
                activeData && activeData.map((area, i) => {
                  return (
                    <li key={i} style={{marginLeft: ((area.level - 1) * 7) + 'px'}}>
                      <label style={{display: ((visible[area.name] === true || visible[area.name] === undefined) ? 'block' : 'none'), fontWeight: (area.area_type === 'region') ? 700 : 400}} title={'Toggle ' + area.name + ' in the chart'} aria-label={'Toggle ' + area.name + ' in the chart'}>
                        <span className={'input_container'}>
                          <input type="checkbox" value={area.name} checked={(selected[area.name] === true) ? true : false} onChange={() => chooseActiveData(area)} />
                        </span>
                        <span className={'label_container'}>{area.name}</span>
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
        <div className={'right' + ' ' + 'container'}>
          {
            // Title
          }
          <div className={'title_container'}>
            <h3>By region and economy, 1990–2021</h3>
            <div className={'options_container'}>
              {
                // <label style={{display: 'none'}}>
                //   <span className={'input_container'}>
                //     <input type="checkbox" value={relativeToPopulation} selected={relativeToPopulation} onChange={() => toggleRelativeToPopulation()} />
                //   </span>
                //   <span className={'label_container'}>Relative to Population</span>
                // </label>
              }
              <span className={'input_container'}>
                <button onClick={() => toggleLinearLogarithmicScale('linear')} className={'linearlogarithmic' + ' ' + 'selected'} title="Use linear scale on y-axis" aria-label="Use linear scale on y-axis">Linear</button>
              </span>
              <span className={'input_container'}>
                <button onClick={() => toggleLinearLogarithmicScale('logarithmic')} className={'linearlogarithmic'} title="Use logarithmic scale on y-axis"  aria-label="Use logarithmic scale on y-axis">Log</button>
              </span>
              <span className={'button_group'}></span>
              <span className={'input_container'}>
                <button onClick={() => changeDataType('fdi_inflows')} className={'data_type' + ' ' + 'selected'} title="Select FDI inflows dataset" aria-label="Select FDI inflows dataset">Inflows</button>
              </span>
              <span className={'input_container'}>
                <button onClick={() => changeDataType('fdi_outflows')} className={'data_type'} title="Select FDI outflows dataset" aria-label="Select FDI outflows dataset">Outflows</button>
              </span>
            </div>
          </div>
          <div className={'chart_container' + ' ' + 'container'}>
            <div className={'info'} style={{'display': Object.values(selected).reduce((a, item) => a + item, 0) > 0 ? 'none' : 'flex'}}><h3>Select at least one country or region from the left</h3></div>
            <div className={'highchart_container'} id="highchart-container" style={{'display': Object.values(selected).reduce((a, item) => a + item, 0) > 0 ? 'block' : 'none'}}></div>
            <img src="//unctad.org/sites/default/files/2022-06/unctad_logo.svg" alt="UNCTAD logo" className={'unctad_logo'} />
            <div className={'legend_container'}>
              {
                legend && legend.map((legend_item, i) => {
                  return (<span key={i} style={{color:legend_item.color}} onClick={() => chooseActiveData(legend_item)} title={'Remove ' + legend_item.name + ' from the chart'} aria-label={'Remove ' + legend_item.name + ' from the chart'}>{legendIcon(legend_item.symbol, legend_item.color)}{legend_item.name}</span>);
                })
              }
            </div>
            <div className={'source_container'}><em>Source:</em> <a href="//unctad.org/topic/investment/world-investment-report" target="_blank">UNCTAD World Investment Report 2022</a></div>
          </div>
        </div>
      </div>
      <noscript>Your browser does not support JavaScript!</noscript>
    </div>
  );
};

export default App;
