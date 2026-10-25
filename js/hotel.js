// ======================================================
// PackageHolidayCompare
// Public Hotel Details Page
// Version: 2026-10-25-1
// ======================================================

let currentHotel = null;
let currentOffers = [];
let currentImages = [];
let supplierMap = {};

let currentSearchCriteria = {};
let searchFilteringActive = false;


// ======================================================
// SETTINGS
// ======================================================

const HOTEL_DATE_FLEX_DAYS = 3;
const HOTEL_NIGHT_FLEX = 3;


// Keep TRUE while manually entered test offers are used.
// Change to FALSE when genuine supplier feeds /
// affiliate offers are connected.
const DEMO_MODE = true;


// ======================================================
// START
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    initialiseHotelPage
);


async function initialiseHotelPage() {

    if (!window.db) {

        showError(
            "The holiday database is currently unavailable."
        );

        return;
    }


    const hotelReference =
        getHotelReference();


    if (!hotelReference) {

        showError(
            "No hotel was selected."
        );

        return;
    }


    try {

        currentSearchCriteria =
            getCurrentSearchCriteria();


        searchFilteringActive =
            hasOfferSearchCriteria(
                currentSearchCriteria
            );


        await loadHotel(
            hotelReference
        );


        await Promise.all([

            loadHotelImages(),

            loadSuppliers()

        ]);


        // Suppliers must load first so offers from
        // inactive suppliers can be removed.
        await loadHotelOffers();


        renderHotel();

        renderDemoNotice();

        hideLoading();


    } catch (error) {

        console.error(
            "Hotel page loading failed:",
            error
        );


        showError(
            error?.message ||
            "Unable to load this hotel."
        );
    }
}


// ======================================================
// HOTEL REFERENCE
// ======================================================

function getHotelReference() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const id =
        params.get(
            "id"
        );


    const slug =
        params.get(
            "slug"
        );


    if (id) {

        return {

            type:
                "id",

            value:
                id

        };
    }


    if (slug) {

        return {

            type:
                "slug",

            value:
                slug

        };
    }


    return null;
}


// ======================================================
// LOAD HOTEL
// ======================================================

async function loadHotel(
    reference
) {

    // IMPORTANT:
    // Public hotel pages only expose published hotels.

    let query =
        window.db
            .from(
                "hotels"
            )
            .select(
                "*"
            )
            .eq(
                "published",
                true
            );


    if (
        reference.type ===
        "id"
    ) {

        query =
            query.eq(
                "id",
                reference.value
            );

    } else {

        query =
            query.eq(
                "slug",
                reference.value
            );
    }


    const {
        data,
        error
    } =
        await query.single();


    if (
        error ||
        !data
    ) {

        throw new Error(
            "This hotel is not currently available."
        );
    }


    currentHotel =
        data;
}


// ======================================================
// LOCAL STORAGE
// ======================================================

function getStoredValue(
    ...keys
) {

    for (
        const key
        of keys
    ) {

        const value =
            localStorage.getItem(
                key
            );


        if (
            value !== null &&
            String(
                value
            ).trim() !==
            ""
        ) {

            return String(
                value
            ).trim();
        }
    }


    return "";
}


// ======================================================
// CURRENT SEARCH
// ======================================================

function getCurrentSearchCriteria() {

    const departureDate =
        getStoredValue(
            "departureDate",
            "departDate",
            "departure"
        );


    const returnDate =
        getStoredValue(
            "returnDate",
            "return"
        );


    let nights =
        Number(
            getStoredValue(
                "nights"
            )
        ) ||
        0;


    if (
        !nights &&
        departureDate &&
        returnDate
    ) {

        nights =
            calculateNightsBetweenDates(
                departureDate,
                returnDate
            );
    }


    return {

        airport:
            getStoredValue(
                "airport",
                "departureAirport"
            ),

        destination:
            getStoredValue(
                "destination"
            ),

        departureDate,

        returnDate,

        nights,

        adults:
            Number(
                getStoredValue(
                    "adults"
                )
            ) ||
            0,

        children:
            Number(
                getStoredValue(
                    "children"
                )
            ) ||
            0,

        board:
            getStoredValue(
                "board",
                "boardBasis",
                "board_basis"
            ),

        budget:
            Number(
                getStoredValue(
                    "budget"
                )
            ) ||
            0

    };
}


// ======================================================
// SEARCH FILTER CHECK
// ======================================================

function hasOfferSearchCriteria(
    search
) {

    return Boolean(

        search.airport ||

        search.departureDate ||

        search.nights ||

        search.board ||

        search.budget

    );
}


function hasSearchSummaryCriteria(
    search
) {

    return Boolean(

        search.airport ||

        search.destination ||

        search.departureDate ||

        search.returnDate ||

        search.nights ||

        search.adults ||

        search.children ||

        search.board ||

        search.budget

    );
}


// ======================================================
// CALCULATE NIGHTS
// ======================================================

function calculateNightsBetweenDates(
    departureValue,
    returnValue
) {

    if (
        !departureValue ||
        !returnValue
    ) {

        return 0;
    }


    const departure =
        new Date(
            `${departureValue}T00:00:00`
        );


    const returnDate =
        new Date(
            `${returnValue}T00:00:00`
        );


    if (
        Number.isNaN(
            departure.getTime()
        ) ||
        Number.isNaN(
            returnDate.getTime()
        )
    ) {

        return 0;
    }


    const difference =
        returnDate.getTime() -
        departure.getTime();


    if (
        difference <=
        0
    ) {

        return 0;
    }


    return Math.round(

        difference /

        (
            1000 *
            60 *
            60 *
            24
        )

    );
}


// ======================================================
// HOTEL IMAGES
// ======================================================

async function loadHotelImages() {

    currentImages =
        [];


    if (
        !currentHotel?.id
    ) {

        return;
    }


    try {

        const {
            data,
            error
        } =
            await window.db
                .from(
                    "hotel_images"
                )
                .select(`
                    id,
                    hotel_id,
                    image_url,
                    alt_text,
                    is_main,
                    sort_order,
                    created_at
                `)
                .eq(
                    "hotel_id",
                    currentHotel.id
                )
                .order(
                    "is_main",
                    {
                        ascending:
                            false
                    }
                )
                .order(
                    "sort_order",
                    {
                        ascending:
                            true
                    }
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            true
                    }
                );


        if (
            error
        ) {

            throw error;
        }


        currentImages =
            Array.isArray(
                data
            )
                ? data
                : [];


    } catch (error) {

        console.error(
            "Hotel images could not be loaded:",
            error
        );


        currentImages =
            [];
    }
}


// ======================================================
// ACTIVE SUPPLIERS ONLY
// ======================================================

async function loadSuppliers() {

    supplierMap =
        {};


    const {
        data,
        error
    } =
        await window.db
            .from(
                "suppliers"
            )
            .select(`
                name,
                slug,
                logo_url,
                website_url,
                active
            `)
            .eq(
                "active",
                true
            );


    if (
        error
    ) {

        throw error;
    }


    (
        data ||
        []
    ).forEach(
        supplier => {

            const key =
                normaliseText(
                    supplier.name
                );


            if (
                key
            ) {

                supplierMap[
                    key
                ] =
                    supplier;
            }
        }
    );
}


// ======================================================
// LOAD HOTEL OFFERS
// ======================================================

async function loadHotelOffers() {

    currentOffers =
        [];


    if (
        !currentHotel?.id
    ) {

        return;
    }


    const {
        data,
        error
    } =
        await window.db
            .from(
                "holiday_offers"
            )
            .select(
                "*"
            )
            .eq(
                "hotel_id",
                currentHotel.id
            );


    if (
        error
    ) {

        throw error;
    }


    let offers =
        Array.isArray(
            data
        )
            ? data
            : [];


    // IMPORTANT:
    // Offers belonging to inactive suppliers
    // are completely removed from public pages.

    offers =
        offers.filter(
            offer => {

                const supplierName =
                    getOfferSupplierName(
                        offer
                    );


                return Boolean(
                    getSupplierRecord(
                        supplierName
                    )
                );
            }
        );


    if (
        searchFilteringActive
    ) {

        offers =
            offers.filter(
                offer =>
                    offerMatchesCurrentSearch(
                        offer,
                        currentSearchCriteria
                    )
            );
    }


    offers.sort(
        (
            first,
            second
        ) =>
            getOfferPrice(
                first
            ) -
            getOfferPrice(
                second
            )
    );


    currentOffers =
        offers;
}


// ======================================================
// OFFER SEARCH MATCHING
// ======================================================

function offerMatchesCurrentSearch(
    offer,
    search
) {

    if (
        search.airport &&
        normaliseText(
            offer?.airport
        ) !==
        normaliseText(
            search.airport
        )
    ) {

        return false;
    }


    if (
        search.board &&
        normaliseText(
            getOfferBoard(
                offer
            )
        ) !==
        normaliseText(
            search.board
        )
    ) {

        return false;
    }


    if (
        search.budget &&
        getOfferPrice(
            offer
        ) >
        search.budget
    ) {

        return false;
    }


    if (
        search.nights
    ) {

        const offerNights =
            Number(
                offer?.nights
            ) ||
            0;


        if (
            !offerNights
        ) {

            return false;
        }


        const difference =
            Math.abs(
                offerNights -
                search.nights
            );


        if (
            difference >
            HOTEL_NIGHT_FLEX
        ) {

            return false;
        }
    }


    if (
        search.departureDate
    ) {

        const difference =
            getSignedDateDifference(

                getOfferDeparture(
                    offer
                ),

                search.departureDate

            );


        if (
            difference ===
            null
        ) {

            return false;
        }


        if (
            Math.abs(
                difference
            ) >
            HOTEL_DATE_FLEX_DAYS
        ) {

            return false;
        }
    }


    return true;
}


// ======================================================
// DATE DIFFERENCE
// ======================================================

function getSignedDateDifference(
    offerValue,
    requestedValue
) {

    const offerDateValue =
        String(
            offerValue ||
            ""
        ).slice(
            0,
            10
        );


    const requestedDateValue =
        String(
            requestedValue ||
            ""
        ).slice(
            0,
            10
        );


    if (
        !offerDateValue ||
        !requestedDateValue
    ) {

        return null;
    }


    const offerDate =
        new Date(
            `${offerDateValue}T00:00:00`
        );


    const requestedDate =
        new Date(
            `${requestedDateValue}T00:00:00`
        );


    if (
        Number.isNaN(
            offerDate.getTime()
        ) ||
        Number.isNaN(
            requestedDate.getTime()
        )
    ) {

        return null;
    }


    return Math.round(

        (
            offerDate.getTime() -
            requestedDate.getTime()
        ) /

        (
            1000 *
            60 *
            60 *
            24
        )

    );
}


// ======================================================
// RENDER PAGE
// ======================================================

function renderHotel() {

    renderSearchSummary();

    renderHotelHeading();

    renderGallery();

    renderHotelDescription();

    renderHotelFacts();

    renderHotelFacilities();

    renderHotelRoomTypes();

    renderCheapestOffer();

    renderOffersTable();

    updateDocumentTitle();
}


// ======================================================
// DEMO NOTICE
// ======================================================

function renderDemoNotice() {

    const content =
        document.getElementById(
            "hotelContent"
        );


    if (
        !content
    ) {

        return;
    }


    const existing =
        document.getElementById(
            "hotelDemoNotice"
        );


    if (
        existing
    ) {

        existing.remove();
    }


    if (
        !DEMO_MODE
    ) {

        return;
    }


    const notice =
        document.createElement(
            "div"
        );


    notice.id =
        "hotelDemoNotice";


    notice.textContent =
        "Demo mode: the supplier names, holiday offers and prices currently shown are test data. They are not live prices or confirmed availability.";


    notice.style.margin =
        "0 0 24px";


    notice.style.padding =
        "14px 16px";


    notice.style.border =
        "1px solid #f4c95d";


    notice.style.borderRadius =
        "10px";


    notice.style.background =
        "#fff8df";


    notice.style.color =
        "#6f5200";


    notice.style.fontSize =
        "14px";


    notice.style.fontWeight =
        "700";


    notice.style.lineHeight =
        "1.5";


    content.prepend(
        notice
    );
}


// ======================================================
// SEARCH SUMMARY
// ======================================================

function renderSearchSummary() {

    const card =
        document.getElementById(
            "searchSummaryCard"
        );


    if (
        !card
    ) {

        return;
    }


    if (
        !hasSearchSummaryCriteria(
            currentSearchCriteria
        )
    ) {

        card.style.display =
            "none";

        return;
    }


    card.style.display =
        "block";


    setText(
        "summaryAirport",

        currentSearchCriteria.airport ||
        "Any airport"
    );


    setText(
        "summaryDestination",

        currentSearchCriteria.destination ||

        currentHotel?.country ||

        currentHotel?.destination ||

        "Anywhere"
    );


    setText(
        "summaryDeparture",

        currentSearchCriteria.departureDate
            ? formatDate(
                currentSearchCriteria.departureDate
            )
            : "Any date"
    );


    setText(
        "summaryReturn",

        currentSearchCriteria.returnDate
            ? formatDate(
                currentSearchCriteria.returnDate
            )
            : "Flexible"
    );


    setText(
        "summaryNights",

        currentSearchCriteria.nights
            ? `${currentSearchCriteria.nights} nights`
            : "Any duration"
    );


    setText(
        "summaryGuests",

        formatGuests(

            currentSearchCriteria.adults,

            currentSearchCriteria.children

        )
    );


    setText(
        "summaryBoard",

        currentSearchCriteria.board ||
        "Any board"
    );


    setText(
        "summaryBudget",

        currentSearchCriteria.budget
            ? `Up to ${formatPrice(
                currentSearchCriteria.budget
            )}`
            : "Any budget"
    );
}


// ======================================================
// GUESTS
// ======================================================

function formatGuests(
    adults,
    children
) {

    const parts =
        [];


    if (
        adults
    ) {

        parts.push(
            `${adults} ${
                adults === 1
                    ? "adult"
                    : "adults"
            }`
        );
    }


    if (
        children
    ) {

        parts.push(
            `${children} ${
                children === 1
                    ? "child"
                    : "children"
            }`
        );
    }


    return parts.length > 0
        ? parts.join(
            ", "
        )
        : "Guests not specified";
}


// ======================================================
// HOTEL HEADING
// ======================================================

function renderHotelHeading() {

    setText(
        "hotelName",

        currentHotel?.name ||
        "Hotel"
    );


    const locationParts =
        [

            currentHotel?.destination,

            currentHotel?.country

        ].filter(
            Boolean
        );


    setText(
        "hotelLocation",

        locationParts.join(
            ", "
        )
    );


    const stars =
        Number(
            currentHotel?.stars
        ) ||
        0;


    setText(
        "hotelStars",

        stars > 0
            ? "★".repeat(
                Math.min(
                    Math.round(
                        stars
                    ),
                    5
                )
            )
            : ""
    );
}


// ======================================================
// GALLERY
// ======================================================

function renderGallery() {

    const mainImage =
        document.getElementById(
            "mainHotelImage"
        );


    const thumbnails =
        document.getElementById(
            "galleryThumbnails"
        );


    if (
        !mainImage ||
        !thumbnails
    ) {

        return;
    }


    thumbnails.innerHTML =
        "";


    const galleryImages =
        currentImages.filter(
            image =>
                isValidHttpUrl(
                    image.image_url
                )
        );


    if (
        galleryImages.length ===
        0 &&
        isValidHttpUrl(
            currentHotel?.main_image
        )
    ) {

        galleryImages.push({

            id:
                "main-image-fallback",

            image_url:
                currentHotel.main_image,

            alt_text:
                currentHotel.name,

            is_main:
                true

        });
    }


    if (
        galleryImages.length ===
        0
    ) {

        mainImage.removeAttribute(
            "src"
        );


        mainImage.style.display =
            "none";


        thumbnails.style.display =
            "none";


        return;
    }


    mainImage.style.display =
        "block";


    thumbnails.style.display =
        "flex";


    const firstImage =

        galleryImages.find(
            image =>
                image.is_main ===
                true
        ) ||

        galleryImages[0];


    setMainGalleryImage(
        firstImage
    );


    galleryImages.forEach(
        (
            image,
            index
        ) => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "gallery-thumbnail";


            if (
                image.id ===
                firstImage.id
            ) {

                button.classList.add(
                    "active"
                );
            }


            const thumbnailImage =
                document.createElement(
                    "img"
                );


            thumbnailImage.src =
                image.image_url;


            thumbnailImage.alt =

                image.alt_text ||

                currentHotel.name ||

                "Hotel image";


            thumbnailImage.loading =
                index < 3
                    ? "eager"
                    : "lazy";


            button.appendChild(
                thumbnailImage
            );


            button.addEventListener(
                "click",
                () => {

                    setMainGalleryImage(
                        image
                    );


                    document
                        .querySelectorAll(
                            ".gallery-thumbnail"
                        )
                        .forEach(
                            thumbnail => {

                                thumbnail
                                    .classList
                                    .remove(
                                        "active"
                                    );
                            }
                        );


                    button.classList.add(
                        "active"
                    );
                }
            );


            thumbnails.appendChild(
                button
            );
        }
    );
}


// ======================================================
// MAIN GALLERY IMAGE
// ======================================================

function setMainGalleryImage(
    image
) {

    const mainImage =
        document.getElementById(
            "mainHotelImage"
        );


    if (
        !mainImage ||
        !image
    ) {

        return;
    }


    mainImage.src =
        image.image_url;


    mainImage.alt =

        image.alt_text ||

        currentHotel?.name ||

        "Hotel image";
}


// ======================================================
// DESCRIPTION
// ======================================================

function renderHotelDescription() {

    const description =
        String(

            currentHotel?.description ||

            ""

        ).trim();


    setText(
        "hotelDescription",

        description ||

        "More information about this hotel will be added soon."
    );
}


// ======================================================
// HOTEL FACTS
// ======================================================

function renderHotelFacts() {

    setText(
        "hotelDestination",

        currentHotel?.destination ||
        "-"
    );


    setText(
        "hotelCountry",

        currentHotel?.country ||
        "-"
    );


    setText(
        "hotelBoard",

        currentHotel?.board_basis ||
        "-"
    );


    const rating =
        Number(
            currentHotel?.rating
        );


    setText(
        "hotelRating",

        Number.isFinite(
            rating
        ) &&
        rating > 0
            ? String(
                rating
            )
            : "-"
    );


    setText(
        "hotelAirport",

        currentHotel?.airport ||
        "-"
    );


    setText(
        "hotelTransfer",

        currentHotel?.transfer_time ||
        "-"
    );
}


// ======================================================
// FACILITIES
// ======================================================

function renderHotelFacilities() {

    const container =
        document.getElementById(
            "hotelFacilities"
        );


    if (
        !container
    ) {

        return;
    }


    container.innerHTML =
        "";


    const facilities =
        normaliseListField(
            currentHotel?.facilities
        );


    if (
        facilities.length ===
        0
    ) {

        appendEmptySectionMessage(

            container,

            "Hotel facilities have not been added yet."

        );


        return;
    }


    facilities.forEach(
        facility => {

            const name =
                getListItemName(
                    facility
                );


            if (
                !name
            ) {

                return;
            }


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "facility-item";


            const icon =
                document.createElement(
                    "span"
                );


            icon.className =
                "facility-icon";


            icon.textContent =
                "✓";


            const text =
                document.createElement(
                    "span"
                );


            text.textContent =
                name;


            item.appendChild(
                icon
            );


            item.appendChild(
                text
            );


            container.appendChild(
                item
            );
        }
    );
}


// ======================================================
// ROOM TYPES
// ======================================================

function renderHotelRoomTypes() {

    const container =
        document.getElementById(
            "hotelRoomTypes"
        );


    if (
        !container
    ) {

        return;
    }


    container.innerHTML =
        "";


    const roomTypes =
        normaliseListField(
            currentHotel?.room_types
        );


    if (
        roomTypes.length ===
        0
    ) {

        appendEmptySectionMessage(

            container,

            "Room types have not been added yet."

        );


        return;
    }


    roomTypes.forEach(
        room => {

            const roomName =
                getListItemName(
                    room
                );


            if (
                !roomName
            ) {

                return;
            }


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "room-type-item";


            const name =
                document.createElement(
                    "p"
                );


            name.className =
                "room-type-name";


            name.textContent =
                roomName;


            item.appendChild(
                name
            );


            const description =
                getListItemDescription(
                    room
                );


            if (
                description
            ) {

                const descriptionElement =
                    document.createElement(
                        "p"
                    );


                descriptionElement.style.margin =
                    "8px 0 0";


                descriptionElement.style.color =
                    "#64748b";


                descriptionElement.style.lineHeight =
                    "1.5";


                descriptionElement.textContent =
                    description;


                item.appendChild(
                    descriptionElement
                );
            }


            container.appendChild(
                item
            );
        }
    );
}


// ======================================================
// EMPTY SECTION
// ======================================================

function appendEmptySectionMessage(
    container,
    text
) {

    const message =
        document.createElement(
            "p"
        );


    message.className =
        "empty-section";


    message.textContent =
        text;


    container.appendChild(
        message
    );
}


// ======================================================
// NORMALISE LIST FIELD
// ======================================================

function normaliseListField(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return [];
    }


    if (
        Array.isArray(
            value
        )
    ) {

        return value;
    }


    if (
        typeof value ===
        "object"
    ) {

        if (
            Array.isArray(
                value.items
            )
        ) {

            return value.items;
        }


        return Object.values(
            value
        );
    }


    if (
        typeof value ===
        "string"
    ) {

        const trimmed =
            value.trim();


        if (
            !trimmed
        ) {

            return [];
        }


        try {

            const parsed =
                JSON.parse(
                    trimmed
                );


            if (
                Array.isArray(
                    parsed
                )
            ) {

                return parsed;
            }


            if (
                parsed &&
                typeof parsed ===
                "object"
            ) {

                if (
                    Array.isArray(
                        parsed.items
                    )
                ) {

                    return parsed.items;
                }


                return Object.values(
                    parsed
                );
            }


        } catch (error) {

            // Continue as plain text.
        }


        return trimmed
            .split(
                /[\n,;]+/
            )
            .map(
                item =>
                    item.trim()
            )
            .filter(
                Boolean
            );
    }


    return [];
}


// ======================================================
// LIST ITEM NAME
// ======================================================

function getListItemName(
    item
) {

    if (
        item === null ||
        item === undefined
    ) {

        return "";
    }


    if (
        typeof item ===
        "string" ||
        typeof item ===
        "number"
    ) {

        return String(
            item
        ).trim();
    }


    if (
        typeof item ===
        "object"
    ) {

        const possibleName =

            item.name ||

            item.title ||

            item.label ||

            item.room_type ||

            item.roomType ||

            item.facility ||

            item.value;


        if (
            possibleName !==
            undefined &&
            possibleName !==
            null
        ) {

            return String(
                possibleName
            ).trim();
        }
    }


    return "";
}


// ======================================================
// LIST ITEM DESCRIPTION
// ======================================================

function getListItemDescription(
    item
) {

    if (
        !item ||
        typeof item !==
        "object" ||
        Array.isArray(
            item
        )
    ) {

        return "";
    }


    return String(

        item.description ||

        item.details ||

        item.info ||

        ""

    ).trim();
}


// ======================================================
// DEAL LINKS
// ======================================================

function createDealLink(
    bookingUrl,
    supplierName,
    className,
    offerId,
    buttonText = "View Deal"
) {

    if (
        !isValidHttpUrl(
            bookingUrl
        )
    ) {

        return null;
    }


    const dealButton =
        document.createElement(
            "a"
        );


    dealButton.href =
        bookingUrl.trim();


    dealButton.target =
        "_blank";


    dealButton.rel =
        "sponsored noopener";


    dealButton.className =
        className;


    dealButton.textContent =
        buttonText;


    dealButton.setAttribute(
        "aria-label",

        `${buttonText} with ${supplierName} - opens in a new tab`
    );


    dealButton.dataset.supplier =
        supplierName;


    dealButton.dataset.outbound =
        "true";


    const cleanOfferId =
        String(
            offerId ||
            ""
        ).trim();


    if (
        cleanOfferId
    ) {

        dealButton.dataset.offerId =
            cleanOfferId;


        dealButton.addEventListener(
            "click",
            () => {

                trackDealClick(
                    cleanOfferId,
                    "hotel"
                );
            }
        );
    }


    return dealButton;
}


// ======================================================
// OUTBOUND CLICK TRACKING
// ======================================================

async function trackDealClick(
    offerId,
    sourcePage = "hotel"
) {

    if (
        !window.db ||
        !offerId
    ) {

        return;
    }


    try {

        const {
            error
        } =
            await window.db.rpc(
                "track_deal_click",
                {

                    p_offer_id:
                        offerId,

                    p_source_page:
                        sourcePage

                }
            );


        if (
            error
        ) {

            console.warn(
                "Deal click tracking failed:",
                error
            );
        }


    } catch (error) {

        console.warn(
            "Deal click tracking failed:",
            error
        );
    }
}


// ======================================================
// AFFILIATE DISCLOSURE
// ======================================================

function createAffiliateDisclosure() {

    const disclosure =
        document.createElement(
            "p"
        );


    disclosure.textContent =
        "We may earn a commission if you book through a supplier link. This does not change the price you pay.";


    disclosure.style.margin =
        "12px 0 0";


    disclosure.style.color =
        "#64748b";


    disclosure.style.fontSize =
        "12px";


    disclosure.style.lineHeight =
        "1.5";


    return disclosure;
}


// ======================================================
// OFFERS TABLE DISCLOSURE
// ======================================================

function renderOffersAffiliateDisclosure() {

    const tableBody =
        document.getElementById(
            "offersTable"
        );


    if (
        !tableBody
    ) {

        return;
    }


    const table =
        tableBody.closest(
            "table"
        );


    if (
        !table
    ) {

        return;
    }


    const wrapper =
        table.parentElement;


    if (
        !wrapper
    ) {

        return;
    }


    const existing =
        document.getElementById(
            "offersAffiliateDisclosure"
        );


    if (
        existing
    ) {

        existing.remove();
    }


    const hasDealLink =
        currentOffers.some(
            offer =>
                isValidHttpUrl(
                    getOfferBookingUrl(
                        offer
                    )
                )
        );


    if (
        !hasDealLink
    ) {

        return;
    }


    const disclosure =
        createAffiliateDisclosure();


    disclosure.id =
        "offersAffiliateDisclosure";


    disclosure.style.margin =
        "14px 2px 0";


    wrapper.appendChild(
        disclosure
    );
}


// ======================================================
// CHEAPEST OFFER
// ======================================================

function renderCheapestOffer() {

    const container =
        document.getElementById(
            "cheapestOfferContent"
        );


    if (
        !container
    ) {

        return;
    }


    container.innerHTML =
        "";


    if (
        currentOffers.length ===
        0
    ) {

        const message =
            document.createElement(
                "p"
            );


        message.textContent =
            searchFilteringActive
                ? "There are currently no offers for this hotel that match your search."
                : "There are currently no holiday offers available for this hotel.";


        container.appendChild(
            message
        );


        return;
    }


    const offer =
        currentOffers[0];


    const supplierName =
        getOfferSupplierName(
            offer
        );


    const supplier =
        getSupplierRecord(
            supplierName
        );


    if (
        supplier &&
        isValidHttpUrl(
            supplier.logo_url
        )
    ) {

        const logo =
            document.createElement(
                "img"
            );


        logo.src =
            supplier.logo_url;


        logo.alt =
            `${supplierName} logo`;


        logo.className =
            "supplier-logo";


        container.appendChild(
            logo
        );
    }


    const label =
        document.createElement(
            "div"
        );


    label.className =
        "cheapest-label";


    label.textContent =
        DEMO_MODE
            ? searchFilteringActive
                ? "Example lowest price matching your search"
                : "Example lowest listed price"
            : searchFilteringActive
                ? "Lowest price matching your search"
                : "Current lowest listed price";


    container.appendChild(
        label
    );


    const supplierElement =
        document.createElement(
            "div"
        );


    supplierElement.className =
        "cheapest-supplier";


    supplierElement.textContent =
        supplierName;


    container.appendChild(
        supplierElement
    );


    const price =
        document.createElement(
            "div"
        );


    price.className =
        "cheapest-price";


    price.textContent =
        formatPrice(
            getOfferPrice(
                offer
            )
        );


    container.appendChild(
        price
    );


    const details =
        document.createElement(
            "div"
        );


    details.className =
        "cheapest-details";


    const detailParts =
        [];


    const departure =
        getOfferDeparture(
            offer
        );


    if (
        departure
    ) {

        detailParts.push(
            `Departure: ${formatDate(
                departure
            )}`
        );
    }


    if (
        offer.airport
    ) {

        detailParts.push(
            `Airport: ${offer.airport}`
        );
    }


    if (
        offer.nights
    ) {

        detailParts.push(
            `${offer.nights} nights`
        );
    }


    const board =
        getOfferBoard(
            offer
        );


    if (
        board
    ) {

        detailParts.push(
            board
        );
    }


    const roomType =
        getOfferRoomType(
            offer
        );


    if (
        roomType
    ) {

        detailParts.push(
            roomType
        );
    }


    details.textContent =
        detailParts.join(
            " • "
        );


    container.appendChild(
        details
    );


    const dealButton =
        createDealLink(

            getOfferBookingUrl(
                offer
            ),

            supplierName,

            "deal-button",

            offer.id

        );


    if (
        dealButton
    ) {

        container.appendChild(
            dealButton
        );


        container.appendChild(
            createAffiliateDisclosure()
        );


    } else {

        const disabledButton =
            document.createElement(
                "span"
            );


        disabledButton.className =
            "deal-button disabled";


        disabledButton.textContent =
            "No booking link";


        container.appendChild(
            disabledButton
        );
    }
}


// ======================================================
// OFFERS TABLE
// ======================================================

function renderOffersTable() {

    const table =
        document.getElementById(
            "offersTable"
        );


    if (
        !table
    ) {

        return;
    }


    table.innerHTML =
        "";


    if (
        currentOffers.length ===
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
            8;


        cell.className =
            "empty-offers";


        cell.textContent =
            searchFilteringActive
                ? "No supplier offers match your current search."
                : "No holiday offers are currently available.";


        row.appendChild(
            cell
        );


        table.appendChild(
            row
        );


        renderOffersAffiliateDisclosure();


        return;
    }


    currentOffers.forEach(
        offer => {

            const row =
                document.createElement(
                    "tr"
                );


            const supplierName =
                getOfferSupplierName(
                    offer
                );


            const supplier =
                getSupplierRecord(
                    supplierName
                );


            const supplierCell =
                document.createElement(
                    "td"
                );


            supplierCell.className =
                "supplier-cell";


            if (
                supplier &&
                isValidHttpUrl(
                    supplier.logo_url
                )
            ) {

                const logo =
                    document.createElement(
                        "img"
                    );


                logo.src =
                    supplier.logo_url;


                logo.alt =
                    `${supplierName} logo`;


                logo.className =
                    "supplier-logo";


                supplierCell.appendChild(
                    logo
                );
            }


            const supplierText =
                document.createElement(
                    "strong"
                );


            supplierText.textContent =
                supplierName;


            supplierCell.appendChild(
                supplierText
            );


            row.appendChild(
                supplierCell
            );


            const priceCell =
                document.createElement(
                    "td"
                );


            priceCell.className =
                "offer-price";


            priceCell.textContent =
                formatPrice(
                    getOfferPrice(
                        offer
                    )
                );


            row.appendChild(
                priceCell
            );


            appendTextCell(

                row,

                formatDate(
                    getOfferDeparture(
                        offer
                    )
                )

            );


            appendTextCell(

                row,

                offer.airport ||
                "-"

            );


            appendTextCell(

                row,

                offer.nights
                    ? String(
                        offer.nights
                    )
                    : "-"

            );


            appendTextCell(

                row,

                getOfferBoard(
                    offer
                ) ||
                "-"

            );


            appendTextCell(

                row,

                getOfferRoomType(
                    offer
                ) ||
                "-"

            );


            const dealCell =
                document.createElement(
                    "td"
                );


            const dealButton =
                createDealLink(

                    getOfferBookingUrl(
                        offer
                    ),

                    supplierName,

                    "small-deal-button",

                    offer.id

                );


            if (
                dealButton
            ) {

                dealCell.appendChild(
                    dealButton
                );


            } else {

                const noLink =
                    document.createElement(
                        "span"
                    );


                noLink.className =
                    "no-link";


                noLink.textContent =
                    "No link";


                dealCell.appendChild(
                    noLink
                );
            }


            row.appendChild(
                dealCell
            );


            table.appendChild(
                row
            );
        }
    );


    renderOffersAffiliateDisclosure();
}


// ======================================================
// OFFER HELPERS
// ======================================================

function getOfferPrice(
    offer
) {

    const price =
        Number(
            offer?.price
        );


    return Number.isFinite(
        price
    )
        ? price
        : 0;
}


function getOfferSupplierName(
    offer
) {

    return (
        offer?.supplier ||
        "Supplier"
    );
}


function getOfferDeparture(
    offer
) {

    return (

        offer?.departure_date ||

        offer?.depart_date ||

        ""

    );
}


function getOfferBoard(
    offer
) {

    return (

        offer?.board_basis ||

        offer?.board ||

        ""

    );
}


function getOfferRoomType(
    offer
) {

    return (

        offer?.room_type ||

        offer?.room ||

        ""

    );
}


function getOfferBookingUrl(
    offer
) {

    return (

        offer?.booking_url ||

        offer?.booking_link ||

        ""

    );
}


// ======================================================
// SUPPLIER LOOKUP
// ======================================================

function getSupplierRecord(
    supplierName
) {

    const key =
        normaliseText(
            supplierName
        );


    return (
        supplierMap[
            key
        ] ||
        null
    );
}


// ======================================================
// HOTEL SEO
// ======================================================

function updateDocumentTitle() {

    if (
        !currentHotel?.name
    ) {

        return;
    }


    // ==================================================
    // HOTEL SEO VALUES
    // ==================================================

    const hotelName =
        String(
            currentHotel.name ||
            ""
        ).trim();


    const destination =
        String(
            currentHotel.destination ||
            ""
        ).trim();


    const country =
        String(
            currentHotel.country ||
            ""
        ).trim();


    const seoTitle =
        String(
            currentHotel.seo_title ||
            ""
        ).trim();


    const seoDescription =
        String(
            currentHotel.seo_description ||
            ""
        ).trim();


    const hotelDescription =
        String(
            currentHotel.description ||
            ""
        )
            .replace(
                /\s+/g,
                " "
            )
            .trim();


    // ==================================================
    // PAGE TITLE
    // ==================================================

    const defaultTitle =
        destination
            ? `${hotelName} Holidays in ${destination} | PackageHolidayCompare`
            : `${hotelName} Holidays | PackageHolidayCompare`;


    const pageTitle =
        seoTitle ||
        defaultTitle;


    document.title =
        pageTitle;


    // ==================================================
    // META DESCRIPTION
    // ==================================================

    let defaultDescription =
        `Compare package holiday offers for ${hotelName}`;


    if (
        destination ||
        country
    ) {

        const location =
            [
                destination,
                country
            ]
                .filter(
                    Boolean
                )
                .join(
                    ", "
                );


        defaultDescription +=
            ` in ${location}`;
    }


    defaultDescription +=
        ". View hotel details, facilities, room types and available supplier deals.";


    const description =
        (
            seoDescription ||
            hotelDescription ||
            defaultDescription
        )
            .replace(
                /\s+/g,
                " "
            )
            .trim()
            .slice(
                0,
                160
            );


    // ==================================================
    // CANONICAL URL
    // ==================================================

    let canonicalUrl =
        `${window.location.origin}/hotel.html`;


    if (
        currentHotel.slug
    ) {

        canonicalUrl +=
            `?slug=${encodeURIComponent(
                currentHotel.slug
            )}`;


    } else if (
        currentHotel.id
    ) {

        canonicalUrl +=
            `?id=${encodeURIComponent(
                currentHotel.id
            )}`;
    }


    // ==================================================
    // MAIN SEO IMAGE
    // ==================================================

    const imageUrls =
        [];


    if (
        isValidHttpUrl(
            currentHotel.main_image
        )
    ) {

        imageUrls.push(
            currentHotel.main_image
        );
    }


    currentImages.forEach(
        image => {

            if (
                isValidHttpUrl(
                    image?.image_url
                ) &&
                !imageUrls.includes(
                    image.image_url
                )
            ) {

                imageUrls.push(
                    image.image_url
                );
            }
        }
    );


    const mainImage =
        imageUrls[0] ||
        "";


    // ==================================================
    // META HELPER
    // ==================================================

    function setMetaTag(
        attribute,
        key,
        content
    ) {

        if (
            !content
        ) {

            return;
        }


        let tag =
            document.head.querySelector(
                `meta[${attribute}="${key}"]`
            );


        if (
            !tag
        ) {

            tag =
                document.createElement(
                    "meta"
                );


            tag.setAttribute(
                attribute,
                key
            );


            document.head.appendChild(
                tag
            );
        }


        tag.setAttribute(
            "content",
            content
        );
    }


    // ==================================================
    // STANDARD SEO
    // ==================================================

    setMetaTag(
        "name",
        "description",
        description
    );


    setMetaTag(
        "name",
        "robots",
        "index, follow"
    );


    // ==================================================
    // CANONICAL
    // ==================================================

    let canonical =
        document.head.querySelector(
            'link[rel="canonical"]'
        );


    if (
        !canonical
    ) {

        canonical =
            document.createElement(
                "link"
            );


        canonical.rel =
            "canonical";


        document.head.appendChild(
            canonical
        );
    }


    canonical.href =
        canonicalUrl;


    // ==================================================
    // OPEN GRAPH
    // ==================================================

    setMetaTag(
        "property",
        "og:type",
        "website"
    );


    setMetaTag(
        "property",
        "og:site_name",
        "PackageHolidayCompare"
    );


    setMetaTag(
        "property",
        "og:title",
        pageTitle
    );


    setMetaTag(
        "property",
        "og:description",
        description
    );


    setMetaTag(
        "property",
        "og:url",
        canonicalUrl
    );


    if (
        mainImage
    ) {

        setMetaTag(
            "property",
            "og:image",
            mainImage
        );
    }


    // ==================================================
    // TWITTER / X
    // ==================================================

    setMetaTag(
        "name",
        "twitter:card",
        mainImage
            ? "summary_large_image"
            : "summary"
    );


    setMetaTag(
        "name",
        "twitter:title",
        pageTitle
    );


    setMetaTag(
        "name",
        "twitter:description",
        description
    );


    if (
        mainImage
    ) {

        setMetaTag(
            "name",
            "twitter:image",
            mainImage
        );
    }


    // ==================================================
    // HOTEL STRUCTURED DATA
    // ==================================================

    const existingStructuredData =
        document.getElementById(
            "hotelStructuredData"
        );


    if (
        existingStructuredData
    ) {

        existingStructuredData.remove();
    }


    const structuredData = {

        "@context":
            "https://schema.org",

        "@type":
            "Hotel",

        name:
            hotelName,

        url:
            canonicalUrl,

        description:
            description

    };


    if (
        imageUrls.length > 0
    ) {

        structuredData.image =
            imageUrls;
    }


    if (
        destination ||
        country
    ) {

        structuredData.address = {

            "@type":
                "PostalAddress"

        };


        if (
            destination
        ) {

            structuredData.address.addressLocality =
                destination;
        }


        if (
            country
        ) {

            structuredData.address.addressCountry =
                country;
        }
    }


    const stars =
        Number(
            currentHotel.stars
        );


    if (
        Number.isFinite(
            stars
        ) &&
        stars > 0 &&
        stars <= 5
    ) {

        structuredData.starRating = {

            "@type":
                "Rating",

            ratingValue:
                stars,

            bestRating:
                5

        };
    }


    const structuredDataScript =
        document.createElement(
            "script"
        );


    structuredDataScript.id =
        "hotelStructuredData";


    structuredDataScript.type =
        "application/ld+json";


    structuredDataScript.textContent =
        JSON.stringify(
            structuredData
        );


    document.head.appendChild(
        structuredDataScript
    );

}


// ======================================================
// PRICE FORMAT
// ======================================================

function formatPrice(
    price
) {

    const value =
        Number(
            price
        );


    if (
        !Number.isFinite(
            value
        )
    ) {

        return "-";
    }


    return new Intl.NumberFormat(
        "en-GB",
        {

            style:
                "currency",

            currency:
                "GBP",

            maximumFractionDigits:
                value % 1 === 0
                    ? 0
                    : 2

        }
    ).format(
        value
    );
}


// ======================================================
// DATE FORMAT
// ======================================================

function formatDate(
    dateValue
) {

    if (
        !dateValue
    ) {

        return "-";
    }


    const cleanDate =
        String(
            dateValue
        ).slice(
            0,
            10
        );


    const date =
        new Date(
            `${cleanDate}T00:00:00`
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
                "numeric",

            month:
                "short",

            year:
                "numeric"

        }
    ).format(
        date
    );
}


// ======================================================
// URL VALIDATION
// ======================================================

function isValidHttpUrl(
    value
) {

    if (
        typeof value !==
        "string"
    ) {

        return false;
    }


    const trimmed =
        value.trim();


    if (
        !trimmed
    ) {

        return false;
    }


    try {

        const url =
            new URL(
                trimmed
            );


        return (

            url.protocol ===
            "http:" ||

            url.protocol ===
            "https:"

        );


    } catch (error) {

        return false;
    }
}


// ======================================================
// NORMALISE TEXT
// ======================================================

function normaliseText(
    value
) {

    return String(
        value ||
        ""
    )
        .trim()
        .toLowerCase();
}


// ======================================================
// TABLE CELL
// ======================================================

function appendTextCell(
    row,
    value
) {

    const cell =
        document.createElement(
            "td"
        );


    cell.textContent =
        value;


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


    if (
        !element
    ) {

        return;
    }


    element.textContent =
        value;
}


// ======================================================
// LOADING
// ======================================================

function hideLoading() {

    const loading =
        document.getElementById(
            "loadingCard"
        );


    const content =
        document.getElementById(
            "hotelContent"
        );


    const error =
        document.getElementById(
            "errorCard"
        );


    if (
        loading
    ) {

        loading.style.display =
            "none";
    }


    if (
        error
    ) {

        error.style.display =
            "none";
    }


    if (
        content
    ) {

        content.style.display =
            "block";
    }
}


// ======================================================
// ERROR
// ======================================================

function showError(
    message
) {

    const loading =
        document.getElementById(
            "loadingCard"
        );


    const content =
        document.getElementById(
            "hotelContent"
        );


    const errorCard =
        document.getElementById(
            "errorCard"
        );


    const errorMessage =
        document.getElementById(
            "errorMessage"
        );


    if (
        loading
    ) {

        loading.style.display =
            "none";
    }


    if (
        content
    ) {

        content.style.display =
            "none";
    }


    if (
        errorCard
    ) {

        errorCard.style.display =
            "block";
    }


    if (
        errorMessage
    ) {

        errorMessage.textContent =
            message;
    }
}