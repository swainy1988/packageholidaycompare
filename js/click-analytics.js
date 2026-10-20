// ======================================================
// PackageHolidayCompare
// Admin Click Analytics
// Version: 2026-10-20-5
// ======================================================

let allDealClicks = [];
let filteredDealClicks = [];

let allDealConversions = [];
let filteredDealConversions = [];

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

        attachConversionControls();


        await loadHotels();

        await loadDealClicks();

        await loadDealConversions();


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
// DATE FILTER
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
// CONVERSION CONTROLS
// ======================================================

function attachConversionControls() {

    const form =
        document.getElementById(
            "conversionForm"
        );


    const closeButton =
        document.getElementById(
            "closeConversionModal"
        );


    const cancelButton =
        document.getElementById(
            "cancelConversionButton"
        );


    const deleteButton =
        document.getElementById(
            "deleteConversionButton"
        );


    const modal =
        document.getElementById(
            "conversionModal"
        );


    if (form) {

        form.addEventListener(
            "submit",
            saveConversion
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeConversionModal
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeConversionModal
        );

    }


    if (deleteButton) {

        deleteButton.addEventListener(
            "click",
            deleteConversion
        );

    }


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {

                    closeConversionModal();

                }

            }
        );

    }


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeConversionModal();

            }

        }
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


    const filteredClickIds =
        new Set(
            filteredDealClicks.map(
                click =>
                    String(
                        click.id
                    )
            )
        );


    filteredDealConversions =
        allDealConversions.filter(
            conversion =>
                filteredClickIds.has(
                    String(
                        conversion.click_id
                    )
                )
        );


    updateDateRangeText(
        selectedRange
    );


    updateTotalClicksLabel(
        selectedRange
    );


    renderSummaryCards();

    renderConversionSummary();

    renderClickTrendChart(
        selectedRange
    );

    renderSupplierStats();

    renderHotelStats();

    renderConversionStats();

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
// DELAY
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
// LOAD DEAL CLICKS
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
// LOAD CONVERSIONS
// ======================================================

async function loadDealConversions() {

    allDealConversions = [];


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
                .from(
                    "deal_conversions"
                )
                .select(`
                    id,
                    click_id,
                    status,
                    booking_value,
                    commission_value,
                    currency,
                    booked_at,
                    notes,
                    created_at,
                    updated_at
                `)
                .order(
                    "booked_at",
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


        allDealConversions.push(
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
// CONVERSION SUMMARY
// ======================================================

function renderConversionSummary() {

    const confirmed =
        filteredDealConversions.filter(
            conversion =>
                conversion.status ===
                "confirmed"
        );


    const confirmedBookings =
        confirmed.length;


    const conversionRate =
        filteredDealClicks.length > 0
            ? (
                confirmedBookings /
                filteredDealClicks.length
            ) * 100
            : 0;


    const bookingValue =
        confirmed.reduce(
            (
                total,
                conversion
            ) =>
                total +
                safeNumber(
                    conversion.booking_value
                ),
            0
        );


    const commissionValue =
        confirmed.reduce(
            (
                total,
                conversion
            ) =>
                total +
                safeNumber(
                    conversion.commission_value
                ),
            0
        );


    setText(
        "confirmedBookings",
        formatNumber(
            confirmedBookings
        )
    );


    setText(
        "conversionRate",
        `${conversionRate.toFixed(
            1
        )}%`
    );


    setText(
        "bookingValue",
        formatMoney(
            bookingValue
        )
    );


    setText(
        "commissionValue",
        formatMoney(
            commissionValue
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
                String(
                    hour
                ),

            label:
                `${String(
                    hour
                ).padStart(
                    2,
                    "0"
                )}:00`,

            fullLabel:
                `${String(
                    hour
                ).padStart(
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
        spanDays <= 31
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
// ALL TIME DAILY
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

        appendEmptyRow(
            table,
            4,
            "No deal clicks were recorded in this date range."
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


            stats[
                supplier
            ].total++;


            if (
                click.source_page ===
                "results"
            ) {

                stats[
                    supplier
                ].results++;

            }


            if (
                click.source_page ===
                "hotel"
            ) {

                stats[
                    supplier
                ].hotel++;

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
// HOTEL STATS
// ======================================================

function renderHotelStats() {

    const table =
        document.getElementById(
            "hotelStatsBody"
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

        appendEmptyRow(
            table,
            4,
            "No hotel clicks were recorded in this date range."
        );

        return;

    }


    const stats =
        {};


    filteredDealClicks.forEach(
        click => {

            const hotelId =
                click.hotel_id
                    ? String(
                        click.hotel_id
                    )
                    : "removed";


            const hotelName =
                hotelId ===
                "removed"
                    ? "Hotel removed"
                    : hotelNames[
                        hotelId
                    ] ||
                    "Unknown hotel";


            if (
                !stats[
                    hotelId
                ]
            ) {

                stats[
                    hotelId
                ] = {

                    hotelId,

                    hotelName,

                    total:
                        0,

                    results:
                        0,

                    hotel:
                        0

                };

            }


            stats[
                hotelId
            ].total++;


            if (
                click.source_page ===
                "results"
            ) {

                stats[
                    hotelId
                ].results++;

            }


            if (
                click.source_page ===
                "hotel"
            ) {

                stats[
                    hotelId
                ].hotel++;

            }

        }
    );


    const hotelStats =
        Object
            .values(
                stats
            )
            .sort(
                (
                    first,
                    second
                ) => {

                    if (
                        second.total !==
                        first.total
                    ) {

                        return (
                            second.total -
                            first.total
                        );

                    }


                    return (
                        first.hotelName ||
                        ""
                    ).localeCompare(
                        second.hotelName ||
                        ""
                    );

                }
            );


    hotelStats.forEach(
        hotel => {

            const row =
                document.createElement(
                    "tr"
                );


            appendTextCell(
                row,
                hotel.hotelName,
                true
            );


            appendTextCell(
                row,
                formatNumber(
                    hotel.total
                )
            );


            appendTextCell(
                row,
                formatNumber(
                    hotel.results
                )
            );


            appendTextCell(
                row,
                formatNumber(
                    hotel.hotel
                )
            );


            table.appendChild(
                row
            );

        }
    );

}


// ======================================================
// CONVERSION TABLE
// ======================================================

function renderConversionStats() {

    const table =
        document.getElementById(
            "conversionStatsBody"
        );


    if (!table) {
        return;
    }


    table.innerHTML =
        "";


    if (
        filteredDealConversions.length ===
        0
    ) {

        appendEmptyRow(
            table,
            7,
            "No booking conversions have been recorded in this date range."
        );

        return;

    }


    const sortedConversions =
        [
            ...filteredDealConversions
        ].sort(
            (
                first,
                second
            ) =>
                new Date(
                    second.booked_at ||
                    second.created_at ||
                    0
                ).getTime() -
                new Date(
                    first.booked_at ||
                    first.created_at ||
                    0
                ).getTime()
        );


    sortedConversions.forEach(
        conversion => {

            const click =
                getClickById(
                    conversion.click_id
                );


            const row =
                document.createElement(
                    "tr"
                );


            appendTextCell(
                row,
                click?.supplier ||
                "Unknown supplier",
                true
            );


            appendTextCell(
                row,
                getClickHotelName(
                    click
                )
            );


            appendStatusCell(
                row,
                conversion.status
            );


            appendTextCell(
                row,
                formatMoney(
                    conversion.booking_value
                )
            );


            appendTextCell(
                row,
                formatMoney(
                    conversion.commission_value
                )
            );


            appendTextCell(
                row,
                formatDateTime(
                    conversion.booked_at
                )
            );


            const actionCell =
                document.createElement(
                    "td"
                );


            const button =
                createActionButton(
                    "Edit",
                    () => {

                        openConversionModal(
                            click,
                            conversion
                        );

                    }
                );


            actionCell.appendChild(
                button
            );


            row.appendChild(
                actionCell
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

        appendEmptyRow(
            table,
            6,
            "No deal clicks were recorded in this date range."
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

            const conversion =
                getConversionForClick(
                    click.id
                );


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


            appendTextCell(
                row,
                getClickHotelName(
                    click
                )
            );


            appendTextCell(
                row,
                formatDateTime(
                    click.clicked_at
                )
            );


            appendStatusCell(
                row,
                conversion
                    ? conversion.status
                    : "none"
            );


            const actionCell =
                document.createElement(
                    "td"
                );


            const button =
                createActionButton(
                    conversion
                        ? "Edit Booking"
                        : "Mark Booking",
                    () => {

                        openConversionModal(
                            click,
                            conversion
                        );

                    }
                );


            actionCell.appendChild(
                button
            );


            row.appendChild(
                actionCell
            );


            table.appendChild(
                row
            );

        }
    );

}


// ======================================================
// OPEN CONVERSION MODAL
// ======================================================

function openConversionModal(
    click,
    conversion = null
) {

    if (!click) {

        alert(
            "The original deal click could not be found."
        );

        return;
    }


    const modal =
        document.getElementById(
            "conversionModal"
        );


    if (!modal) {
        return;
    }


    setInputValue(
        "conversionClickId",
        click.id
    );


    setInputValue(
        "conversionId",
        conversion?.id ||
        ""
    );


    setInputValue(
        "conversionStatus",
        conversion?.status ||
        "confirmed"
    );


    setInputValue(
        "conversionBookingValue",
        conversion?.booking_value ??
        ""
    );


    setInputValue(
        "conversionCommissionValue",
        conversion?.commission_value ??
        ""
    );


    setInputValue(
        "conversionNotes",
        conversion?.notes ||
        ""
    );


    setInputValue(
        "conversionBookedAt",
        conversion?.booked_at
            ? formatDateTimeLocal(
                conversion.booked_at
            )
            : formatDateTimeLocal(
                new Date().toISOString()
            )
    );


    setText(
        "conversionModalTitle",
        conversion
            ? "Edit Booking"
            : "Mark Booking"
    );


    const summary =
        document.getElementById(
            "conversionClickSummary"
        );


    if (summary) {

        summary.textContent =
            `${click.supplier || "Unknown supplier"} • ` +
            `${getClickHotelName(click)} • ` +
            `${formatDateTime(click.clicked_at)}`;

    }


    const deleteButton =
        document.getElementById(
            "deleteConversionButton"
        );


    if (deleteButton) {

        deleteButton.hidden =
            !conversion;

    }


    const saveButton =
        document.getElementById(
            "saveConversionButton"
        );


    if (saveButton) {

        saveButton.textContent =
            conversion
                ? "Save Changes"
                : "Save Booking";

        saveButton.disabled =
            false;

    }


    setConversionFormMessage(
        ""
    );


    modal.classList.add(
        "open"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );

}


// ======================================================
// CLOSE CONVERSION MODAL
// ======================================================

function closeConversionModal() {

    const modal =
        document.getElementById(
            "conversionModal"
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "open"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    setConversionFormMessage(
        ""
    );

}


// ======================================================
// SAVE CONVERSION
// ======================================================

async function saveConversion(
    event
) {

    event.preventDefault();


    const clickId =
        getInputValue(
            "conversionClickId"
        );


    const conversionId =
        getInputValue(
            "conversionId"
        );


    const status =
        getInputValue(
            "conversionStatus"
        );


    const bookingValueText =
        getInputValue(
            "conversionBookingValue"
        );


    const commissionValueText =
        getInputValue(
            "conversionCommissionValue"
        );


    const bookedAtText =
        getInputValue(
            "conversionBookedAt"
        );


    const notes =
        getInputValue(
            "conversionNotes"
        ).trim();


    if (!clickId) {

        setConversionFormMessage(
            "The deal click could not be identified."
        );

        return;
    }


    if (
        ![
            "pending",
            "confirmed",
            "cancelled"
        ].includes(
            status
        )
    ) {

        setConversionFormMessage(
            "Please choose a valid booking status."
        );

        return;
    }


    const bookingValue =
        parseOptionalMoney(
            bookingValueText
        );


    const commissionValue =
        parseOptionalMoney(
            commissionValueText
        );


    if (
        bookingValue ===
        false
    ) {

        setConversionFormMessage(
            "Booking value must be a valid positive amount."
        );

        return;
    }


    if (
        commissionValue ===
        false
    ) {

        setConversionFormMessage(
            "Commission must be a valid positive amount."
        );

        return;
    }


    let bookedAt =
        new Date().toISOString();


    if (
        bookedAtText
    ) {

        const date =
            new Date(
                bookedAtText
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            setConversionFormMessage(
                "Please enter a valid booking date."
            );

            return;
        }


        bookedAt =
            date.toISOString();

    }


    const payload = {

        click_id:
            Number(
                clickId
            ),

        status,

        booking_value:
            bookingValue,

        commission_value:
            commissionValue,

        currency:
            "GBP",

        booked_at:
            bookedAt,

        notes:
            notes ||
            null,

        updated_at:
            new Date().toISOString()

    };


    const saveButton =
        document.getElementById(
            "saveConversionButton"
        );


    if (saveButton) {
        saveButton.disabled = true;
    }


    setConversionFormMessage(
        conversionId
            ? "Saving changes..."
            : "Saving booking..."
    );


    try {

        let error;


        if (
            conversionId
        ) {

            const result =
                await window.db
                    .from(
                        "deal_conversions"
                    )
                    .update(
                        payload
                    )
                    .eq(
                        "id",
                        conversionId
                    );


            error =
                result.error;

        } else {

            const result =
                await window.db
                    .from(
                        "deal_conversions"
                    )
                    .insert(
                        payload
                    );


            error =
                result.error;

        }


        if (error) {
            throw error;
        }


        await loadDealConversions();


        applyDateFilter();


        setAnalyticsMessage(
            conversionId
                ? "Booking conversion updated successfully."
                : "Booking conversion recorded successfully."
        );


        closeConversionModal();

    } catch (error) {

        console.error(
            "Could not save conversion:",
            error
        );


        setConversionFormMessage(
            error?.message ||
            "The booking conversion could not be saved."
        );


        if (saveButton) {
            saveButton.disabled = false;
        }

    }

}


// ======================================================
// DELETE CONVERSION
// ======================================================

async function deleteConversion() {

    const conversionId =
        getInputValue(
            "conversionId"
        );


    if (!conversionId) {
        return;
    }


    const confirmed =
        window.confirm(
            "Delete this booking conversion?"
        );


    if (!confirmed) {
        return;
    }


    const deleteButton =
        document.getElementById(
            "deleteConversionButton"
        );


    if (deleteButton) {
        deleteButton.disabled = true;
    }


    setConversionFormMessage(
        "Deleting conversion..."
    );


    try {

        const {
            error
        } =
            await window.db
                .from(
                    "deal_conversions"
                )
                .delete()
                .eq(
                    "id",
                    conversionId
                );


        if (error) {
            throw error;
        }


        await loadDealConversions();


        applyDateFilter();


        setAnalyticsMessage(
            "Booking conversion deleted."
        );


        closeConversionModal();

    } catch (error) {

        console.error(
            "Could not delete conversion:",
            error
        );


        setConversionFormMessage(
            error?.message ||
            "The booking conversion could not be deleted."
        );


        if (deleteButton) {
            deleteButton.disabled = false;
        }

    }

}


// ======================================================
// FIND CONVERSION FOR CLICK
// ======================================================

function getConversionForClick(
    clickId
) {

    return allDealConversions.find(
        conversion =>
            String(
                conversion.click_id
            ) ===
            String(
                clickId
            )
    ) || null;

}


// ======================================================
// FIND CLICK
// ======================================================

function getClickById(
    clickId
) {

    return allDealClicks.find(
        click =>
            String(
                click.id
            ) ===
            String(
                clickId
            )
    ) || null;

}


// ======================================================
// HOTEL NAME FROM CLICK
// ======================================================

function getClickHotelName(
    click
) {

    if (!click) {
        return "Unknown hotel";
    }


    if (
        !click.hotel_id
    ) {
        return "Hotel removed";
    }


    return (
        hotelNames[
            String(
                click.hotel_id
            )
        ] ||
        "Unknown hotel"
    );

}


// ======================================================
// STATUS CELL
// ======================================================

function appendStatusCell(
    row,
    status
) {

    const cell =
        document.createElement(
            "td"
        );


    const badge =
        document.createElement(
            "span"
        );


    const cleanStatus =
        [
            "confirmed",
            "pending",
            "cancelled"
        ].includes(
            status
        )
            ? status
            : "none";


    badge.className =
        `conversion-badge ${cleanStatus}`;


    badge.textContent =
        formatConversionStatus(
            cleanStatus
        );


    cell.appendChild(
        badge
    );


    row.appendChild(
        cell
    );

}


// ======================================================
// CONVERSION STATUS LABEL
// ======================================================

function formatConversionStatus(
    status
) {

    if (
        status ===
        "confirmed"
    ) {
        return "Confirmed";
    }


    if (
        status ===
        "pending"
    ) {
        return "Pending";
    }


    if (
        status ===
        "cancelled"
    ) {
        return "Cancelled";
    }


    return "Not Booked";

}


// ======================================================
// ACTION BUTTON
// ======================================================

function createActionButton(
    label,
    handler
) {

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =
        "analytics-action-btn";


    button.textContent =
        label;


    button.addEventListener(
        "click",
        handler
    );


    return button;

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
// CHART DATE
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
// FORMAT DATE TIME
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
// DATETIME LOCAL VALUE
// ======================================================

function formatDateTimeLocal(
    dateValue
) {

    const date =
        new Date(
            dateValue
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }


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


    const hours =
        String(
            date.getHours()
        ).padStart(
            2,
            "0"
        );


    const minutes =
        String(
            date.getMinutes()
        ).padStart(
            2,
            "0"
        );


    return (
        `${year}-${month}-${day}` +
        `T${hours}:${minutes}`
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
// FORMAT MONEY
// ======================================================

function formatMoney(
    value
) {

    return new Intl.NumberFormat(
        "en-GB",
        {
            style:
                "currency",
            currency:
                "GBP"
        }
    ).format(
        safeNumber(
            value
        )
    );

}


// ======================================================
// SAFE NUMBER
// ======================================================

function safeNumber(
    value
) {

    const number =
        Number(
            value
        );


    if (
        !Number.isFinite(
            number
        )
    ) {
        return 0;
    }


    return number;

}


// ======================================================
// OPTIONAL MONEY
// ======================================================

function parseOptionalMoney(
    value
) {

    if (
        value === null ||
        value === undefined ||
        String(
            value
        ).trim() ===
        ""
    ) {

        return null;

    }


    const number =
        Number(
            value
        );


    if (
        !Number.isFinite(
            number
        ) ||
        number < 0
    ) {

        return false;

    }


    return Number(
        number.toFixed(
            2
        )
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
// EMPTY TABLE ROW
// ======================================================

function appendEmptyRow(
    table,
    colspan,
    message
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
        colspan;


    cell.textContent =
        message;


    row.appendChild(
        cell
    );


    table.appendChild(
        row
    );

}


// ======================================================
// INPUT HELPERS
// ======================================================

function getInputValue(
    id
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {
        return "";
    }


    return element.value ??
        "";

}


function setInputValue(
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


    element.value =
        value ?? "";

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
// CONVERSION FORM MESSAGE
// ======================================================

function setConversionFormMessage(
    message
) {

    const element =
        document.getElementById(
            "conversionFormMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;

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


    const hotelTable =
        document.getElementById(
            "hotelStatsBody"
        );


    const conversionTable =
        document.getElementById(
            "conversionStatsBody"
        );


    const recentTable =
        document.getElementById(
            "recentClicksBody"
        );


    const chart =
        document.getElementById(
            "clickTrendChart"
        );


    if (supplierTable) {

        supplierTable.innerHTML = "";

        appendEmptyRow(
            supplierTable,
            4,
            "Analytics could not be loaded."
        );

    }


    if (hotelTable) {

        hotelTable.innerHTML = "";

        appendEmptyRow(
            hotelTable,
            4,
            "Hotel analytics could not be loaded."
        );

    }


    if (conversionTable) {

        conversionTable.innerHTML = "";

        appendEmptyRow(
            conversionTable,
            7,
            "Conversion analytics could not be loaded."
        );

    }


    if (recentTable) {

        recentTable.innerHTML = "";

        appendEmptyRow(
            recentTable,
            6,
            "Analytics could not be loaded."
        );

    }


    if (chart) {

        chart.innerHTML =
            "";


        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "chart-empty";


        empty.textContent =
            "Chart could not be loaded.";


        chart.appendChild(
            empty
        );

    }

}