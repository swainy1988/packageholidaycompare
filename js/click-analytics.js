// ======================================================
// PackageHolidayCompare
// Admin Click Analytics
// Version: 2026-10-20-3
// ======================================================

let allDealClicks = [];
let filteredDealClicks = [];
let hotelNames = {};


// ======================================================
// START
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    initialiseClickAnalytics
);


// ======================================================
// INITIALISE
// ======================================================

async function initialiseClickAnalytics() {

    if (!window.db) {

        showAnalyticsError(
            "Supabase is not connected."
        );

        return;
    }


    try {

        const session =
            await waitForAdminSession();


        if (!session) {

            showAnalyticsError(
                "Your admin session could not be confirmed."
            );

            return;
        }


        attachDateFilter();


        await loadHotels();

        await loadDealClicks();


        applyDateFilter();


        setAnalyticsMessage(
            `Analytics updated ${formatDateTime(
                new Date().toISOString()
            )}.`
        );

    } catch (error) {

        console.error(
            "Click analytics failed:",
            error
        );


        showAnalyticsError(
            error?.message ||
            "Click analytics could not be loaded."
        );

    }

}


// ======================================================
// DATE FILTER EVENT
// ======================================================

function attachDateFilter() {

    const filter =
        document.getElementById(
            "dateRangeFilter"
        );


    if (!filter) {
        return;
    }


    filter.addEventListener(
        "change",
        applyDateFilter
    );

}


// ======================================================
// APPLY DATE FILTER
// ======================================================

function applyDateFilter() {

    const filter =
        document.getElementById(
            "dateRangeFilter"
        );


    const selectedRange =
        filter
            ? filter.value
            : "all";


    filteredDealClicks =
        allDealClicks.filter(
            click =>
                clickMatchesDateRange(
                    click.clicked_at,
                    selectedRange
                )
        );


    updateDateRangeText(
        selectedRange
    );


    updateTotalClicksLabel(
        selectedRange
    );


    renderSummaryCards();

    renderClickTrendChart(
        selectedRange
    );

    renderSupplierStats();

    renderRecentClicks();

}


// ======================================================
// CLICK MATCHES DATE RANGE
// ======================================================

function clickMatchesDateRange(
    dateValue,
    range
) {

    if (
        range === "all"
    ) {
        return true;
    }


    if (!dateValue) {
        return false;
    }


    const clickDate =
        new Date(
            dateValue
        );


    if (
        Number.isNaN(
            clickDate.getTime()
        )
    ) {
        return false;
    }


    const now =
        new Date();


    const start =
        new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );


    if (
        range === "today"
    ) {

        return (
            clickDate >= start &&
            clickDate <= now
        );

    }


    const days =
        Number(
            range
        );


    if (
        !Number.isFinite(days) ||
        days < 1
    ) {
        return true;
    }


    start.setDate(
        start.getDate() -
        (days - 1)
    );


    return (
        clickDate >= start &&
        clickDate <= now
    );

}


// ======================================================
// DATE RANGE TEXT
// ======================================================

function updateDateRangeText(
    range
) {

    const element =
        document.getElementById(
            "activeDateRangeText"
        );


    if (!element) {
        return;
    }


    if (
        range === "today"
    ) {

        element.textContent =
            "Showing deal clicks recorded today.";

        return;

    }


    if (
        range === "7"
    ) {

        element.textContent =
            "Showing deal clicks from the last 7 days.";

        return;

    }


    if (
        range === "30"
    ) {

        element.textContent =
            "Showing deal clicks from the last 30 days.";

        return;

    }


    element.textContent =
        "Showing all recorded deal clicks.";

}


// ======================================================
// TOTAL CARD LABEL
// ======================================================

function updateTotalClicksLabel(
    range
) {

    const element =
        document.getElementById(
            "totalClicksLabel"
        );


    if (!element) {
        return;
    }


    if (
        range === "today"
    ) {

        element.textContent =
            "Deal Clicks Today";

        return;

    }


    if (
        range === "7"
    ) {

        element.textContent =
            "Deal Clicks - Last 7 Days";

        return;

    }


    if (
        range === "30"
    ) {

        element.textContent =
            "Deal Clicks - Last 30 Days";

        return;

    }


    element.textContent =
        "Total Deal Clicks";

}


// ======================================================
// WAIT FOR ADMIN SESSION
// ======================================================

async function waitForAdminSession() {

    for (
        let attempt = 0;
        attempt < 10;
        attempt++
    ) {

        const {
            data,
            error
        } =
            await window.db.auth.getSession();


        if (error) {

            console.error(
                "Could not read admin session:",
                error
            );

            return null;

        }


        if (
            data?.session
        ) {

            return data.session;

        }


        await delay(
            150
        );

    }


    return null;

}


// ======================================================
// SMALL DELAY
// ======================================================

function delay(
    milliseconds
) {

    return new Promise(
        resolve => {

            setTimeout(
                resolve,
                milliseconds
            );

        }
    );

}


// ======================================================
// LOAD HOTELS
// ======================================================

async function loadHotels() {

    hotelNames = {};


    const {
        data,
        error
    } =
        await window.db
            .from("hotels")
            .select("id, name")
            .order(
                "name",
                {
                    ascending: true
                }
            );


    if (error) {

        console.warn(
            "Hotel names could not be loaded:",
            error
        );

        return;

    }


    (
        data || []
    ).forEach(
        hotel => {

            if (
                hotel?.id
            ) {

                hotelNames[
                    String(
                        hotel.id
                    )
                ] =
                    hotel.name ||
                    "Unknown hotel";

            }

        }
    );

}


// ======================================================
// LOAD ALL DEAL CLICKS
// ======================================================

async function loadDealClicks() {

    allDealClicks = [];


    const pageSize =
        1000;


    let from =
        0;


    while (true) {

        const to =
            from +
            pageSize -
            1;


        const {
            data,
            error
        } =
            await window.db
                .from("deal_clicks")
                .select(`
                    id,
                    offer_id,
                    hotel_id,
                    supplier,
                    source_page,
                    clicked_at
                `)
                .order(
                    "clicked_at",
                    {
                        ascending: false
                    }
                )
                .range(
                    from,
                    to
                );


        if (error) {
            throw error;
        }


        const rows =
            Array.isArray(data)
                ? data
                : [];


        allDealClicks.push(
            ...rows
        );


        if (
            rows.length <
            pageSize
        ) {
            break;
        }


        from +=
            pageSize;

    }

}


// ======================================================
// SUMMARY CARDS
// ======================================================

function renderSummaryCards() {

    const totalClicks =
        filteredDealClicks.length;


    const todayClicks =
        allDealClicks.filter(
            click =>
                isToday(
                    click.clicked_at
                )
        ).length;


    const resultsClicks =
        filteredDealClicks.filter(
            click =>
                click.source_page ===
                "results"
        ).length;


    const hotelClicks =
        filteredDealClicks.filter(
            click =>
                click.source_page ===
                "hotel"
        ).length;


    setText(
        "totalClicks",
        formatNumber(
            totalClicks
        )
    );


    setText(
        "todayClicks",
        formatNumber(
            todayClicks
        )
    );


    setText(
        "resultsClicks",
        formatNumber(
            resultsClicks
        )
    );


    setText(
        "hotelClicks",
        formatNumber(
            hotelClicks
        )
    );

}


// ======================================================
// CLICK TREND CHART
// ======================================================

function renderClickTrendChart(
    selectedRange
) {

    const chart =
        document.getElementById(
            "clickTrendChart"
        );


    if (!chart) {
        return;
    }


    chart.innerHTML =
        "";


    setText(
        "chartTotal",
        formatNumber(
            filteredDealClicks.length
        )
    );


    if (
        filteredDealClicks.length ===
        0
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "chart-empty";


        empty.textContent =
            "No deal clicks were recorded in this date range.";


        chart.appendChild(
            empty
        );


        updateChartDescription(
            selectedRange
        );


        return;

    }


    const chartData =
        buildChartData(
            selectedRange
        );


    if (
        chartData.length ===
        0
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "chart-empty";


        empty.textContent =
            "There is not enough data to display the chart.";


        chart.appendChild(
            empty
        );


        return;

    }


    const maximum =
        Math.max(
            ...chartData.map(
                item =>
                    item.count
            ),
            1
        );


    chartData.forEach(
        item => {

            const column =
                document.createElement(
                    "div"
                );


            column.className =
                "chart-column";


            const value =
                document.createElement(
                    "div"
                );


            value.className =
                "chart-value";


            value.textContent =
                formatNumber(
                    item.count
                );


            const barArea =
                document.createElement(
                    "div"
                );


            barArea.className =
                "chart-bar-area";


            const bar =
                document.createElement(
                    "div"
                );


            bar.className =
                "chart-bar";


            if (
                item.count > 0
            ) {

                const percentage =
                    item.count /
                    maximum;


                const height =
                    Math.max(
                        8,
                        Math.round(
                            percentage *
                            180
                        )
                    );


                bar.style.height =
                    `${height}px`;

            } else {

                bar.style.height =
                    "0px";

                bar.style.minHeight =
                    "0px";

            }


            bar.title =
                `${item.fullLabel}: ${item.count} click${
                    item.count === 1
                        ? ""
                        : "s"
                }`;


            const label =
                document.createElement(
                    "div"
                );


            label.className =
                "chart-label";


            label.textContent =
                item.label;


            barArea.appendChild(
                bar
            );


            column.appendChild(
                value
            );


            column.appendChild(
                barArea
            );


            column.appendChild(
                label
            );


            chart.appendChild(
                column
            );

        }
    );


    updateChartDescription(
        selectedRange
    );

}


// ======================================================
// BUILD CHART DATA
// ======================================================

function buildChartData(
    selectedRange
) {

    if (
        selectedRange ===
        "today"
    ) {

        return buildHourlyChartData();

    }


    if (
        selectedRange ===
        "7"
    ) {

        return buildDailyChartData(
            7
        );

    }


    if (
        selectedRange ===
        "30"
    ) {

        return buildDailyChartData(
            30
        );

    }


    return buildAllTimeChartData();

}


// ======================================================
// HOURLY CHART
// ======================================================

function buildHourlyChartData() {

    const now =
        new Date();


    const data =
        [];


    for (
        let hour = 0;
        hour <= now.getHours();
        hour++
    ) {

        data.push({
            key:
                String(hour),

            label:
                `${String(hour).padStart(
                    2,
                    "0"
                )}:00`,

            fullLabel:
                `${String(hour).padStart(
                    2,
                    "0"
                )}:00 today`,

            count:
                0
        });

    }


    filteredDealClicks.forEach(
        click => {

            const date =
                new Date(
                    click.clicked_at
                );


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                return;
            }


            const item =
                data[
                    date.getHours()
                ];


            if (item) {
                item.count++;
            }

        }
    );


    return data;

}


// ======================================================
// DAILY CHART
// ======================================================

function buildDailyChartData(
    days
) {

    const data =
        [];


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    for (
        let index =
            days - 1;
        index >= 0;
        index--
    ) {

        const date =
            new Date(
                today
            );


        date.setDate(
            today.getDate() -
            index
        );


        data.push({
            key:
                getLocalDateKey(
                    date
                ),

            label:
                formatShortChartDate(
                    date
                ),

            fullLabel:
                formatLongChartDate(
                    date
                ),

            count:
                0
        });

    }


    const lookup =
        new Map(
            data.map(
                item => [
                    item.key,
                    item
                ]
            )
        );


    filteredDealClicks.forEach(
        click => {

            const date =
                new Date(
                    click.clicked_at
                );


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                return;
            }


            const key =
                getLocalDateKey(
                    date
                );


            const item =
                lookup.get(
                    key
                );


            if (item) {
                item.count++;
            }

        }
    );


    return data;

}


// ======================================================
// ALL TIME CHART
// ======================================================

function buildAllTimeChartData() {

    if (
        filteredDealClicks.length ===
        0
    ) {
        return [];
    }


    const validDates =
        filteredDealClicks
            .map(
                click =>
                    new Date(
                        click.clicked_at
                    )
            )
            .filter(
                date =>
                    !Number.isNaN(
                        date.getTime()
                    )
            );


    if (
        validDates.length ===
        0
    ) {
        return [];
    }


    const earliest =
        new Date(
            Math.min(
                ...validDates.map(
                    date =>
                        date.getTime()
                )
            )
        );


    const latest =
        new Date(
            Math.max(
                ...validDates.map(
                    date =>
                        date.getTime()
                )
            )
        );


    const spanDays =
        Math.floor(
            (
                latest.getTime() -
                earliest.getTime()
            ) /
            86400000
        ) + 1;


    if (
        spanDays <=
        31
    ) {

        return buildAllTimeDailyData(
            earliest,
            latest
        );

    }


    return buildMonthlyChartData(
        earliest,
        latest
    );

}


// ======================================================
// ALL TIME DAILY DATA
// ======================================================

function buildAllTimeDailyData(
    earliest,
    latest
) {

    const start =
        new Date(
            earliest
        );


    start.setHours(
        0,
        0,
        0,
        0
    );


    const end =
        new Date(
            latest
        );


    end.setHours(
        0,
        0,
        0,
        0
    );


    const data =
        [];


    const current =
        new Date(
            start
        );


    while (
        current <= end
    ) {

        data.push({
            key:
                getLocalDateKey(
                    current
                ),

            label:
                formatShortChartDate(
                    current
                ),

            fullLabel:
                formatLongChartDate(
                    current
                ),

            count:
                0
        });


        current.setDate(
            current.getDate() +
            1
        );

    }


    const lookup =
        new Map(
            data.map(
                item => [
                    item.key,
                    item
                ]
            )
        );


    filteredDealClicks.forEach(
        click => {

            const date =
                new Date(
                    click.clicked_at
                );


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                return;
            }


            const item =
                lookup.get(
                    getLocalDateKey(
                        date
                    )
                );


            if (item) {
                item.count++;
            }

        }
    );


    return data;

}


// ======================================================
// MONTHLY CHART
// ======================================================

function buildMonthlyChartData(
    earliest,
    latest
) {

    const data =
        [];


    const current =
        new Date(
            earliest.getFullYear(),
            earliest.getMonth(),
            1
        );


    const end =
        new Date(
            latest.getFullYear(),
            latest.getMonth(),
            1
        );


    while (
        current <= end
    ) {

        data.push({
            key:
                getMonthKey(
                    current
                ),

            label:
                new Intl.DateTimeFormat(
                    "en-GB",
                    {
                        month:
                            "short",

                        year:
                            "2-digit"
                    }
                ).format(
                    current
                ),

            fullLabel:
                new Intl.DateTimeFormat(
                    "en-GB",
                    {
                        month:
                            "long",

                        year:
                            "numeric"
                    }
                ).format(
                    current
                ),

            count:
                0
        });


        current.setMonth(
            current.getMonth() +
            1
        );

    }


    const lookup =
        new Map(
            data.map(
                item => [
                    item.key,
                    item
                ]
            )
        );


    filteredDealClicks.forEach(
        click => {

            const date =
                new Date(
                    click.clicked_at
                );


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                return;
            }


            const item =
                lookup.get(
                    getMonthKey(
                        date
                    )
                );


            if (item) {
                item.count++;
            }

        }
    );


    return data;

}


// ======================================================
// CHART DESCRIPTION
// ======================================================

function updateChartDescription(
    selectedRange
) {

    const element =
        document.getElementById(
            "chartDescription"
        );


    if (!element) {
        return;
    }


    if (
        selectedRange ===
        "today"
    ) {

        element.textContent =
            "Deal clicks by hour today.";

        return;

    }


    if (
        selectedRange ===
        "7"
    ) {

        element.textContent =
            "Deal clicks by day over the last 7 days.";

        return;

    }


    if (
        selectedRange ===
        "30"
    ) {

        element.textContent =
            "Deal clicks by day over the last 30 days.";

        return;

    }


    element.textContent =
        "Deal clicks across all recorded history.";

}


// ======================================================
// LOCAL DATE KEY
// ======================================================

function getLocalDateKey(
    date
) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


// ======================================================
// MONTH KEY
// ======================================================

function getMonthKey(
    date
) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}`;

}


// ======================================================
// SHORT CHART DATE
// ======================================================

function formatShortChartDate(
    date
) {

    return new Intl.DateTimeFormat(
        "en-GB",
        {
            day:
                "2-digit",

            month:
                "short"
        }
    ).format(
        date
    );

}


// ======================================================
// LONG CHART DATE
// ======================================================

function formatLongChartDate(
    date
) {

    return new Intl.DateTimeFormat(
        "en-GB",
        {
            day:
                "2-digit",

            month:
                "long",

            year:
                "numeric"
        }
    ).format(
        date
    );

}


// ======================================================
// SUPPLIER STATS
// ======================================================

function renderSupplierStats() {

    const table =
        document.getElementById(
            "supplierStatsBody"
        );


    if (!table) {
        return;
    }


    table.innerHTML =
        "";


    if (
        filteredDealClicks.length ===
        0
    ) {

        const row =
            document.createElement(
                "tr"
            );


        const cell =
            document.createElement(
                "td"
            );


        cell.colSpan =
            4;


        cell.textContent =
            "No deal clicks were recorded in this date range.";


        row.appendChild(
            cell
        );


        table.appendChild(
            row
        );


        return;

    }


    const stats =
        {};


    filteredDealClicks.forEach(
        click => {

            const supplier =
                String(
                    click.supplier ||
                    "Unknown supplier"
                ).trim();


            if (
                !stats[supplier]
            ) {

                stats[supplier] = {

                    supplier,

                    total:
                        0,

                    results:
                        0,

                    hotel:
                        0

                };

            }


            stats[supplier].total++;


            if (
                click.source_page ===
                "results"
            ) {

                stats[supplier]
                    .results++;

            }


            if (
                click.source_page ===
                "hotel"
            ) {

                stats[supplier]
                    .hotel++;

            }

        }
    );


    const supplierStats =
        Object
            .values(
                stats
            )
            .sort(
                (
                    first,
                    second
                ) =>
                    second.total -
                    first.total
            );


    supplierStats.forEach(
        supplier => {

            const row =
                document.createElement(
                    "tr"
                );


            appendTextCell(
                row,
                supplier.supplier,
                true
            );


            appendTextCell(
                row,
                formatNumber(
                    supplier.total
                )
            );


            appendTextCell(
                row,
                formatNumber(
                    supplier.results
                )
            );


            appendTextCell(
                row,
                formatNumber(
                    supplier.hotel
                )
            );


            table.appendChild(
                row
            );

        }
    );

}


// ======================================================
// RECENT CLICKS
// ======================================================

function renderRecentClicks() {

    const table =
        document.getElementById(
            "recentClicksBody"
        );


    if (!table) {
        return;
    }


    table.innerHTML =
        "";


    if (
        filteredDealClicks.length ===
        0
    ) {

        const row =
            document.createElement(
                "tr"
            );


        const cell =
            document.createElement(
                "td"
            );


        cell.colSpan =
            4;


        cell.textContent =
            "No deal clicks were recorded in this date range.";


        row.appendChild(
            cell
        );


        table.appendChild(
            row
        );


        return;

    }


    const recentClicks =
        filteredDealClicks.slice(
            0,
            50
        );


    recentClicks.forEach(
        click => {

            const row =
                document.createElement(
                    "tr"
                );


            appendTextCell(
                row,
                click.supplier ||
                "Unknown supplier",
                true
            );


            const sourceCell =
                document.createElement(
                    "td"
                );


            const sourceBadge =
                document.createElement(
                    "span"
                );


            sourceBadge.className =
                "source-badge";


            sourceBadge.textContent =
                formatSourcePage(
                    click.source_page
                );


            sourceCell.appendChild(
                sourceBadge
            );


            row.appendChild(
                sourceCell
            );


            const hotelName =
                click.hotel_id
                    ? hotelNames[
                        String(
                            click.hotel_id
                        )
                    ] ||
                    "Unknown hotel"
                    : "Hotel removed";


            appendTextCell(
                row,
                hotelName
            );


            appendTextCell(
                row,
                formatDateTime(
                    click.clicked_at
                )
            );


            table.appendChild(
                row
            );

        }
    );

}


// ======================================================
// SOURCE LABEL
// ======================================================

function formatSourcePage(
    source
) {

    if (
        source ===
        "results"
    ) {

        return "Results";

    }


    if (
        source ===
        "hotel"
    ) {

        return "Hotel";

    }


    return source ||
        "Unknown";

}


// ======================================================
// TODAY CHECK
// ======================================================

function isToday(
    dateValue
) {

    if (!dateValue) {
        return false;
    }


    const date =
        new Date(
            dateValue
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return false;
    }


    const today =
        new Date();


    return (
        date.getFullYear() ===
            today.getFullYear() &&

        date.getMonth() ===
            today.getMonth() &&

        date.getDate() ===
            today.getDate()
    );

}


// ======================================================
// FORMAT DATE AND TIME
// ======================================================

function formatDateTime(
    dateValue
) {

    if (!dateValue) {
        return "-";
    }


    const date =
        new Date(
            dateValue
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            dateValue
        );

    }


    return new Intl.DateTimeFormat(
        "en-GB",
        {

            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit",

            second:
                "2-digit"

        }
    ).format(
        date
    );

}


// ======================================================
// FORMAT NUMBER
// ======================================================

function formatNumber(
    value
) {

    return new Intl.NumberFormat(
        "en-GB"
    ).format(
        Number(
            value
        ) || 0
    );

}


// ======================================================
// TABLE CELL
// ======================================================

function appendTextCell(
    row,
    value,
    strong = false
) {

    const cell =
        document.createElement(
            "td"
        );


    if (
        strong
    ) {

        const text =
            document.createElement(
                "strong"
            );


        text.textContent =
            value;


        cell.appendChild(
            text
        );

    } else {

        cell.textContent =
            value;

    }


    row.appendChild(
        cell
    );

}


// ======================================================
// SET TEXT
// ======================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {
        return;
    }


    element.textContent =
        value;

}


// ======================================================
// STATUS MESSAGE
// ======================================================

function setAnalyticsMessage(
    message
) {

    const element =
        document.getElementById(
            "analyticsMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;

}


// ======================================================
// ERROR
// ======================================================

function showAnalyticsError(
    message
) {

    console.error(
        message
    );


    setAnalyticsMessage(
        message
    );


    const supplierTable =
        document.getElementById(
            "supplierStatsBody"
        );


    const recentTable =
        document.getElementById(
            "recentClicksBody"
        );


    const chart =
        document.getElementById(
            "clickTrendChart"
        );


    if (
        supplierTable
    ) {

        supplierTable.innerHTML = `

            <tr>

                <td colspan="4">
                    Analytics could not be loaded.
                </td>

            </tr>

        `;

    }


    if (
        recentTable
    ) {

        recentTable.innerHTML = `

            <tr>

                <td colspan="4">
                    Analytics could not be loaded.
                </td>

            </tr>

        `;

    }


    if (
        chart
    ) {

        chart.innerHTML = `

            <div class="chart-empty">
                Chart could not be loaded.
            </div>

        `;

    }

}