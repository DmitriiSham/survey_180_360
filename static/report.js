let ReportChart;

document.addEventListener("DOMContentLoaded", () => {
    // user select
    const userSelect = document.getElementById("report");
    userSelect.onchange = (event) => {
        // show loader
        const loader = document.getElementById("loader");
        if (loader) {
            loader.style.display = "block";
        }
        // go to selected user
        const search = window.location.search;
        const searchParams = new URLSearchParams(search);
        searchParams.set("report", event.currentTarget.value);
        window.location.search = searchParams.toString();
    };

    const ctx = document.getElementById("radarChart");
    if (ctx) {
        const plugin = {
            beforeInit(chart) {
                // Get a reference to the original fit function
                const originalFit = chart.legend.fit;

                // Override the fit function
                chart.legend.fit = function fit() {
                    // Call the original function and bind scope in order to use `this` correctly inside it
                    originalFit.bind(chart.legend)();
                    // Change the height as suggested in other answers
                    this.height += 250;
                }
            }
        };
        ReportChart = new Chart(ctx, {
            type: "radar",
            data: chartData || {},
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                },
                pointLabels: {
                    fontSize: 14, // Установка размера меток точек
                },
                scales: {
                    r: {
                        // border: {
                        //     dash: [5, 5],
                        // },
                        // angleLines: {
                        //     borderDash: [5, 5]
                        // },
                        pointLabels: {
                            backdropPadding: -2,
                            padding: -2,
                            color: 'black', //'#8068BC',
                            font: {
                                size: 14,
                            }
                        },
                        grid: {
                            circular: true,
                        },
                        max: 5,
                        min: 0,
                        ticks: {
                            stepSize: 1,
                        }
                    },
                },
                elements: {
                    line: {
                        borderWidth: 3,
                        // tension: 0.2,
                    },
                },
            },
            plugins: [plugin],
        });
        // ReportChart.resize(900, 900);
    }

    window.addEventListener("beforeprint", () => {
        // ReportChart.resize(700, 700);
        const chartContainer = document.getElementById("chartContainer");
        chartContainer.style.height = '650px';
        chartContainer.style.width = '650px';
        const radarChart = document.getElementById("radarChart");
        radarChart.style.height = '650px';
        radarChart.style.width = '650px';
        const table_1 = document.getElementById("table_1");
        table_1.style.marginTop = "-200px";
    });

    window.addEventListener("afterprint", () => {
    //     ReportChart.resize(800, 800);
        const chartContainer = document.getElementById("chartContainer");
        chartContainer.style.height = '800px';
        chartContainer.style.width = '800px';
        const radarChart = document.getElementById("radarChart");
        radarChart.style.height = '800px';
        radarChart.style.width = '800px';
        const table_1 = document.getElementById("table_1");
        table_1.style.marginTop = "-220px";
    });
});
