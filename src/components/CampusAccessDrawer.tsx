/**
 * CampusAccessDrawer — Campus Access & Transit Details
 *
 * Opens when a user clicks "Campus Access" on a selected institution card.
 * Shows virtual campus tours, transit mapping, and proximity metrics.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  MapPin,
  Bus,
  Train,
  Plane,
  Globe,
  ExternalLink,
  Navigation,
  Clock,
  ChevronRight,
  Eye,
  Route,
  Home,
  Building,
  Shield,
  AlertTriangle,
  DollarSign,
  CheckCircle,
  Star,
  Landmark,
  Banknote,
  FileCheck,
  Upload,
  ArrowRight,
  Info,
  Zap,
  CircleDollarSign,
  Lock,
} from "lucide-react";
import type { UserProfile } from "../types/career";
import { cn } from "../lib/utils";
import type { Institution } from "../types/career";

// ─── Virtual tour registry ──────────────────────────────────────────────────

interface TourLink {
  label: string;
  url: string;
  type: "official" | "360" | "video";
}

function getVirtualTours(inst: Institution): TourLink[] {
  const tours: TourLink[] = [];

  // Always link to the institution's official website tour page
  if (inst.website) {
    const base = inst.website.replace(/\/$/, "");
    tours.push({
      label: `${inst.name} Official Tour`,
      url: `${base}/tour`,
      type: "official",
    });
  }

  // Known virtual tour sources by institution name keywords
  const knownTours: Record<string, TourLink[]> = {
    "MIT": [{ label: "MIT Virtual Tour", url: "https://www.mit.edu/virtour/", type: "official" }],
    "Stanford": [{ label: "Stanford Virtual Tour", url: "https://www.stanford.edu/about/visit/virtual-tour/", type: "official" }],
    "Harvard": [{ label: "Harvard Virtual Tour", url: "https://www.harvard.edu/on-campus/visit-harvard/virtual-tour/", type: "official" }],
    "Oxford": [{ label: "Oxford Virtual Tour", url: "https://www.ox.ac.uk/visitors/visiting-oxford/virtual-tour/", type: "official" }],
    "Cambridge": [{ label: "Cambridge Virtual Tour", url: "https://www.cam.ac.uk/virtual-tour", type: "official" }],
    "Toronto": [{ label: "University of Toronto Tour", url: "https://www.utoronto.ca/campus-tours", type: "official" }],
    "UTM": [{ label: "UTM Virtual Campus Tour", url: "https://www.utm.utoronto.ca/future-students/campus-tours", type: "official" }],
    "UCL": [{ label: "UCL Campus Tour", url: "https://www.ucl.ac.uk/prospective-students/visit-ucl", type: "official" }],
    "ETH": [{ label: "ETH Zurich Virtual Tour", url: "https://ethz.ch/en/campus/getting-to-know/virtual-tour.html", type: "official" }],
    "Johns Hopkins": [{ label: "Johns Hopkins Virtual Tour", url: "https://www.jhu.edu/visit/virtual-tour/", type: "official" }],
    "IIT": [{ label: "IIT Campus Tour", url: "https://www.iitb.ac.in/campus-tour", type: "official" }],
    "NUS": [{ label: "NUS Virtual Tour", url: "https://www.nus.edu.sg/osa/student-services/virtual-tour", type: "official" }],
    "Melbourne": [{ label: "University of Melbourne Tour", url: "https://www.unimelb.edu.au/visit", type: "official" }],
    "Tokyo": [{ label: "University of Tokyo Tour", url: "https://www.u-tokyo.ac.jp/en/about/campus-guide.html", type: "official" }],
    "Mayo": [{ label: "Mayo Clinic Virtual Tour", url: "https://college.mayo.edu/visiting/", type: "official" }],
  };

  for (const [key, links] of Object.entries(knownTours)) {
    if (inst.name.toLowerCase().includes(key.toLowerCase())) {
      // Avoid duplicates with existing first entry
      links.forEach((link) => {
        if (!tours.some((t) => t.url === link.url)) {
          tours.unshift(link);
        }
      });
    }
  }

  // YouTube search for campus tours
  tours.push({
    label: `${inst.name} Campus Tour (YouTube)`,
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(inst.name + " campus tour virtual")}`,
    type: "video",
  });

  return tours;
}

// ─── Transit data builder ───────────────────────────────────────────────────

interface TransitInfo {
  nearestAirport: { name: string; distance: string; time: string };
  nearestStation: { name: string; distance: string; time: string };
  localTransit: { name: string; type: "bus" | "train" | "metro"; route: string }[];
  mapsUrl: string;
  directionsUrl: string;
}

function getTransitInfo(inst: Institution): TransitInfo {
  const { lat, lng } = inst.coordinates;

  // Known transit data for popular university cities
  const cityTransit: Record<string, Omit<TransitInfo, "mapsUrl" | "directionsUrl">> = {
    "Cambridge, USA": {
      nearestAirport: { name: "Boston Logan Intl (BOS)", distance: "10 km", time: "25 min" },
      nearestStation: { name: "Kendall/MIT (MBTA Red Line)", distance: "0.3 km", time: "4 min walk" },
      localTransit: [
        { name: "MBTA Red Line", type: "train", route: "Alewife ↔ Braintree" },
        { name: "MBTA Bus 1", type: "bus", route: "Harvard ↔ Dudley" },
        { name: "CT2 Bus", type: "bus", route: "Sullivan Sq ↔ Ruggles via Kendall" },
      ],
    },
    "Stanford, USA": {
      nearestAirport: { name: "San Francisco Intl (SFO)", distance: "30 km", time: "35 min" },
      nearestStation: { name: "Palo Alto Caltrain", distance: "2 km", time: "8 min" },
      localTransit: [
        { name: "Caltrain", type: "train", route: "San Francisco ↔ San Jose" },
        { name: "Marguerite Shuttle", type: "bus", route: "Free campus shuttle" },
        { name: "VTA Bus 22", type: "bus", route: "Palo Alto ↔ Eastridge" },
      ],
    },
    "London, United Kingdom": {
      nearestAirport: { name: "London Heathrow (LHR)", distance: "25 km", time: "45 min" },
      nearestStation: { name: "Euston Square (Underground)", distance: "0.5 km", time: "6 min walk" },
      localTransit: [
        { name: "Northern Line", type: "metro", route: "High Barnet ↔ Morden" },
        { name: "Victoria Line", type: "metro", route: "Brixton ↔ Walthamstow" },
        { name: "Bus 29", type: "bus", route: "Trafalgar Sq ↔ Wood Green" },
      ],
    },
    "Zurich, Switzerland": {
      nearestAirport: { name: "Zurich Airport (ZRH)", distance: "12 km", time: "20 min" },
      nearestStation: { name: "ETH/Universitätsspital (Tram)", distance: "0.2 km", time: "3 min walk" },
      localTransit: [
        { name: "Tram 6", type: "train", route: "Zoo ↔ Enge" },
        { name: "Tram 10", type: "train", route: "Flughafen ↔ Bahnhofplatz" },
        { name: "S-Bahn S3", type: "train", route: "Zürich HB ↔ Effretikon" },
      ],
    },
    "Mumbai, India": {
      nearestAirport: { name: "Chhatrapati Shivaji Intl (BOM)", distance: "12 km", time: "30 min" },
      nearestStation: { name: "Powai Lake (Bus Stop)", distance: "1 km", time: "12 min walk" },
      localTransit: [
        { name: "BEST Bus 392", type: "bus", route: "Hiranandani ↔ Vikhroli Station" },
        { name: "Mumbai Metro Line 1", type: "metro", route: "Versova ↔ Ghatkopar" },
        { name: "Western Railway", type: "train", route: "Churchgate ↔ Dahanu Road" },
      ],
    },
    "Baltimore, USA": {
      nearestAirport: { name: "Baltimore/Washington Intl (BWI)", distance: "16 km", time: "22 min" },
      nearestStation: { name: "Penn Station (MARC/Amtrak)", distance: "3 km", time: "10 min" },
      localTransit: [
        { name: "JHMI Shuttle", type: "bus", route: "Homewood ↔ East Baltimore" },
        { name: "Charm City Circulator", type: "bus", route: "Free downtown loop" },
        { name: "Light Rail", type: "train", route: "BWI ↔ Hunt Valley" },
      ],
    },
    "Mississauga, Canada": {
      nearestAirport: { name: "Toronto Pearson Intl (YYZ)", distance: "8 km", time: "15 min" },
      nearestStation: { name: "Erindale GO Station", distance: "1.5 km", time: "6 min" },
      localTransit: [
        { name: "MiWay Route 110", type: "bus", route: "UTM ↔ Mississauga City Centre" },
        { name: "GO Transit Milton Line", type: "train", route: "Union Station ↔ Milton" },
        { name: "MiWay Route 101", type: "bus", route: "Dundas ↔ UTM Loop" },
      ],
    },
    "Toronto, Canada": {
      nearestAirport: { name: "Toronto Pearson Intl (YYZ)", distance: "25 km", time: "40 min" },
      nearestStation: { name: "St George Station (TTC)", distance: "0.2 km", time: "3 min walk" },
      localTransit: [
        { name: "TTC Line 1 Yonge-University", type: "metro", route: "Finch ↔ Vaughan" },
        { name: "TTC Line 2 Bloor-Danforth", type: "metro", route: "Kipling ↔ Kennedy" },
        { name: "GO Transit Lakeshore", type: "train", route: "Union ↔ Oshawa / Hamilton" },
      ],
    },
    "Singapore, Singapore": {
      nearestAirport: { name: "Changi Airport (SIN)", distance: "20 km", time: "30 min" },
      nearestStation: { name: "Kent Ridge MRT", distance: "0.5 km", time: "5 min walk" },
      localTransit: [
        { name: "MRT Circle Line", type: "metro", route: "HarbourFront ↔ Marina Bay" },
        { name: "NUS Internal Shuttle", type: "bus", route: "Free campus loop (A1, A2, D1, D2)" },
        { name: "Bus 95", type: "bus", route: "Kent Ridge ↔ Clementi" },
      ],
    },
    "Melbourne, Australia": {
      nearestAirport: { name: "Melbourne Airport (MEL)", distance: "22 km", time: "30 min" },
      nearestStation: { name: "Melbourne Central Station", distance: "0.4 km", time: "5 min walk" },
      localTransit: [
        { name: "Tram Route 1", type: "train", route: "East Coburg ↔ South Melbourne Beach" },
        { name: "Tram Route 6", type: "train", route: "Brunswick East ↔ Glen Iris" },
        { name: "Metro Trains Craigieburn Line", type: "train", route: "Flinders St ↔ Craigieburn" },
      ],
    },
    "Rochester, USA": {
      nearestAirport: { name: "Rochester Intl (RST)", distance: "12 km", time: "18 min" },
      nearestStation: { name: "Rochester Amtrak Station", distance: "5 km", time: "12 min" },
      localTransit: [
        { name: "Rochester City Lines", type: "bus", route: "Downtown ↔ Mayo Clinic shuttle" },
        { name: "Mayo Clinic Shuttle", type: "bus", route: "Free inter-campus shuttle" },
      ],
    },
  };

  // Try to find matching city transit data
  const cityKey = `${inst.city}, ${inst.country}`;
  const known = cityTransit[cityKey];

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(inst.name)}&center=${lat},${lng}&zoom=15`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=&travelmode=transit`;

  if (known) {
    return { ...known, mapsUrl, directionsUrl };
  }

  // Fallback: generic transit info
  return {
    nearestAirport: { name: `Nearest airport to ${inst.city}`, distance: "~20 km", time: "~30 min" },
    nearestStation: { name: `${inst.city} Central Station`, distance: "~3 km", time: "~10 min" },
    localTransit: [
      { name: "Local Bus Service", type: "bus", route: `City center ↔ ${inst.name}` },
      { name: "Regional Train", type: "train", route: `${inst.city} main line` },
    ],
    mapsUrl,
    directionsUrl,
  };
}

// ─── Transit icon helper ────────────────────────────────────────────────────

// ─── Housing data builder ───────────────────────────────────────────────────

interface RoomStyle {
  name: string;
  type: "Traditional" | "Suite" | "Townhouse" | "Apartment" | "Studio";
  costPerYear: string;
  includes: string[];
}

interface OnCampusHousing {
  firstYearGuarantee: boolean;
  residences: RoomStyle[];
  applicationUrl: string;
}

interface NeighborhoodRent {
  name: string;
  avgRent: string;
  distanceToCampus: string;
}

interface OffCampusHousing {
  listingsUrl: string;
  listingsPlatform: string;
  neighborhoods: NeighborhoodRent[];
  housingPlaybookUrl: string;
}

interface HousingInfo {
  onCampus: OnCampusHousing;
  offCampus: OffCampusHousing;
}

function getHousingInfo(inst: Institution): HousingInfo {
  const cityHousing: Record<string, HousingInfo> = {
    "Cambridge, USA": {
      onCampus: {
        firstYearGuarantee: true,
        residences: [
          { name: "Baker House", type: "Traditional", costPerYear: "$12,500", includes: ["Meal plan", "Laundry", "Wi-Fi", "Cleaning service"] },
          { name: "Maseeh Hall", type: "Suite", costPerYear: "$14,200", includes: ["Kitchenette", "Common lounge", "Wi-Fi", "24/7 security"] },
          { name: "Sidney-Pacific", type: "Apartment", costPerYear: "$16,800", includes: ["Full kitchen", "Private bath", "Gym access", "Furnished"] },
        ],
        applicationUrl: "https://studentlife.mit.edu/housing",
      },
      offCampus: {
        listingsUrl: "https://www.places4students.com/Places/School?SchoolID=rMSotAi8Rk8%3D",
        listingsPlatform: "Places4Students",
        neighborhoods: [
          { name: "Kendall Square", avgRent: "$2,800/mo", distanceToCampus: "0.5 km" },
          { name: "Central Square", avgRent: "$2,400/mo", distanceToCampus: "1.2 km" },
          { name: "Somerville", avgRent: "$2,100/mo", distanceToCampus: "3 km" },
        ],
        housingPlaybookUrl: "https://studentlife.mit.edu/housing/off-campus-housing",
      },
    },
    "Stanford, USA": {
      onCampus: {
        firstYearGuarantee: true,
        residences: [
          { name: "Stern Hall", type: "Traditional", costPerYear: "$13,000", includes: ["Meal plan", "Laundry", "Study rooms", "Wi-Fi"] },
          { name: "Crothers Hall", type: "Suite", costPerYear: "$14,800", includes: ["Shared kitchen", "Common room", "Wi-Fi", "Bike storage"] },
          { name: "Escondido Village", type: "Townhouse", costPerYear: "$18,500", includes: ["Full kitchen", "Private bath", "Parking", "Furnished"] },
        ],
        applicationUrl: "https://rde.stanford.edu/studenthousing",
      },
      offCampus: {
        listingsUrl: "https://www.places4students.com/Places/School?SchoolID=WCUi2r7Kv0c%3D",
        listingsPlatform: "Places4Students",
        neighborhoods: [
          { name: "Palo Alto", avgRent: "$3,200/mo", distanceToCampus: "2 km" },
          { name: "Mountain View", avgRent: "$2,600/mo", distanceToCampus: "8 km" },
          { name: "Menlo Park", avgRent: "$2,900/mo", distanceToCampus: "5 km" },
        ],
        housingPlaybookUrl: "https://rde.stanford.edu/studenthousing/find-housing-campus",
      },
    },
    "London, United Kingdom": {
      onCampus: {
        firstYearGuarantee: true,
        residences: [
          { name: "Campbell House", type: "Traditional", costPerYear: "£9,500", includes: ["En-suite bath", "Meal plan", "Wi-Fi", "Common kitchen"] },
          { name: "Ramsay Hall", type: "Suite", costPerYear: "£11,200", includes: ["Private bath", "Study desk", "Laundry", "24/7 security"] },
          { name: "Student Village", type: "Studio", costPerYear: "£14,000", includes: ["Kitchenette", "Private bath", "Furnished", "All bills included"] },
        ],
        applicationUrl: "https://www.ucl.ac.uk/accommodation/",
      },
      offCampus: {
        listingsUrl: "https://www.places4students.com/Places/School?SchoolID=sPXHqjjwK98%3D",
        listingsPlatform: "Places4Students",
        neighborhoods: [
          { name: "Bloomsbury", avgRent: "£1,400/mo", distanceToCampus: "0.5 km" },
          { name: "Camden Town", avgRent: "£1,100/mo", distanceToCampus: "2 km" },
          { name: "King's Cross", avgRent: "£1,300/mo", distanceToCampus: "1.5 km" },
        ],
        housingPlaybookUrl: "https://www.ucl.ac.uk/accommodation/find-accommodation/private-accommodation",
      },
    },
    "Zurich, Switzerland": {
      onCampus: {
        firstYearGuarantee: false,
        residences: [
          { name: "WOKO Student Housing", type: "Traditional", costPerYear: "CHF 7,200", includes: ["Shared kitchen", "Wi-Fi", "Laundry room", "Bike storage"] },
          { name: "Student Village Hönggerberg", type: "Suite", costPerYear: "CHF 9,600", includes: ["Private bath", "Study room", "Common lounge", "Near campus"] },
          { name: "JUWO Apartments", type: "Apartment", costPerYear: "CHF 12,000", includes: ["Full kitchen", "Furnished", "All bills included", "Central location"] },
        ],
        applicationUrl: "https://ethz.ch/en/campus/getting-to-know/accommodation.html",
      },
      offCampus: {
        listingsUrl: "https://www.wgzimmer.ch/wgzimmer/search/mate.html",
        listingsPlatform: "WG-Zimmer.ch",
        neighborhoods: [
          { name: "Hönggerberg", avgRent: "CHF 850/mo", distanceToCampus: "0.5 km" },
          { name: "Oerlikon", avgRent: "CHF 900/mo", distanceToCampus: "3 km" },
          { name: "Zentrum (City Center)", avgRent: "CHF 1,200/mo", distanceToCampus: "4 km" },
        ],
        housingPlaybookUrl: "https://ethz.ch/en/campus/getting-to-know/accommodation.html",
      },
    },
    "Mumbai, India": {
      onCampus: {
        firstYearGuarantee: true,
        residences: [
          { name: "Hostel 1–10 (Standard)", type: "Traditional", costPerYear: "₹15,000", includes: ["Mess facilities", "Laundry", "Wi-Fi", "Common room"] },
          { name: "Hostel 15 (New Wing)", type: "Suite", costPerYear: "₹25,000", includes: ["Attached bath", "AC rooms", "Study hall", "Wi-Fi"] },
          { name: "Married Scholar Quarters", type: "Apartment", costPerYear: "₹40,000", includes: ["Full kitchen", "Furnished", "Family housing", "Campus access"] },
        ],
        applicationUrl: "https://www.iitb.ac.in/hostel/",
      },
      offCampus: {
        listingsUrl: "https://www.nobroker.in/property/rent/Mumbai/Powai",
        listingsPlatform: "NoBroker",
        neighborhoods: [
          { name: "Powai", avgRent: "₹18,000/mo", distanceToCampus: "1 km" },
          { name: "Hiranandani", avgRent: "₹22,000/mo", distanceToCampus: "2 km" },
          { name: "Vikhroli", avgRent: "₹14,000/mo", distanceToCampus: "4 km" },
        ],
        housingPlaybookUrl: "https://gymkhana.iitb.ac.in/~scc/newstudent",
      },
    },
    "Baltimore, USA": {
      onCampus: {
        firstYearGuarantee: true,
        residences: [
          { name: "AMR I & II", type: "Traditional", costPerYear: "$11,200", includes: ["Meal plan", "Laundry", "Wi-Fi", "Study lounges"] },
          { name: "Charles Commons", type: "Suite", costPerYear: "$13,500", includes: ["Kitchen", "Private bath", "Fitness center", "24/7 security"] },
          { name: "Homewood Apartments", type: "Apartment", costPerYear: "$15,800", includes: ["Full kitchen", "Furnished", "Parking", "A/C"] },
        ],
        applicationUrl: "https://studentaffairs.jhu.edu/community-living/",
      },
      offCampus: {
        listingsUrl: "https://www.places4students.com/Places/School?SchoolID=cZzxJX1c62c%3D",
        listingsPlatform: "Places4Students",
        neighborhoods: [
          { name: "Charles Village", avgRent: "$1,400/mo", distanceToCampus: "0.5 km" },
          { name: "Hampden", avgRent: "$1,200/mo", distanceToCampus: "3 km" },
          { name: "Remington", avgRent: "$1,100/mo", distanceToCampus: "2 km" },
        ],
        housingPlaybookUrl: "https://studentaffairs.jhu.edu/community-living/off-campus/",
      },
    },
    "Mississauga, Canada": {
      onCampus: {
        firstYearGuarantee: true,
        residences: [
          { name: "Erindale Hall", type: "Traditional", costPerYear: "CAD $9,200", includes: ["Meal plan", "Shared kitchen", "Wi-Fi", "Study rooms"] },
          { name: "MaGrath Valley", type: "Suite", costPerYear: "CAD $10,800", includes: ["Semi-private bath", "Common lounge", "Laundry", "Games room"] },
          { name: "Oscar Peterson Hall", type: "Townhouse", costPerYear: "CAD $12,500", includes: ["Full kitchen", "Private bath", "Furnished", "Near bus loop"] },
        ],
        applicationUrl: "https://www.utm.utoronto.ca/housing/future-residents",
      },
      offCampus: {
        listingsUrl: "https://www.places4students.com/Places/School?SchoolID=bGINQSRxb58%3D",
        listingsPlatform: "Places4Students",
        neighborhoods: [
          { name: "Erindale / UTM Area", avgRent: "CAD $1,400/mo", distanceToCampus: "1 km" },
          { name: "City Centre", avgRent: "CAD $1,800/mo", distanceToCampus: "6 km" },
          { name: "Streetsville", avgRent: "CAD $1,500/mo", distanceToCampus: "5 km" },
        ],
        housingPlaybookUrl: "https://www.utm.utoronto.ca/housing/off-campus-housing",
      },
    },
    "Toronto, Canada": {
      onCampus: {
        firstYearGuarantee: true,
        residences: [
          { name: "Chestnut Residence", type: "Traditional", costPerYear: "CAD $14,500", includes: ["Meal plan", "Fitness center", "Wi-Fi", "Study lounges"] },
          { name: "Woodsworth College", type: "Suite", costPerYear: "CAD $12,800", includes: ["Shared kitchen", "Common room", "Laundry", "Downtown location"] },
          { name: "Graduate House", type: "Apartment", costPerYear: "CAD $16,200", includes: ["Full kitchen", "Private bath", "Furnished", "All utilities"] },
        ],
        applicationUrl: "https://studentlife.utoronto.ca/task/apply-for-on-campus-housing/",
      },
      offCampus: {
        listingsUrl: "https://www.places4students.com/Places/School?SchoolID=Z7gSz2f7K7o%3D",
        listingsPlatform: "Places4Students",
        neighborhoods: [
          { name: "Annex", avgRent: "CAD $1,800/mo", distanceToCampus: "0.5 km" },
          { name: "Kensington Market", avgRent: "CAD $1,600/mo", distanceToCampus: "1.5 km" },
          { name: "Liberty Village", avgRent: "CAD $2,000/mo", distanceToCampus: "4 km" },
        ],
        housingPlaybookUrl: "https://studentlife.utoronto.ca/task/find-off-campus-housing/",
      },
    },
    "Singapore, Singapore": {
      onCampus: {
        firstYearGuarantee: true,
        residences: [
          { name: "Eusoff Hall", type: "Traditional", costPerYear: "SGD $3,600", includes: ["Meal plan", "Laundry", "Wi-Fi", "Sports facilities"] },
          { name: "UTown Residence", type: "Suite", costPerYear: "SGD $5,200", includes: ["A/C", "Common kitchen", "Study rooms", "Gym"] },
          { name: "College Suites", type: "Apartment", costPerYear: "SGD $7,800", includes: ["Full kitchen", "Private bath", "Furnished", "Near MRT"] },
        ],
        applicationUrl: "https://nus.edu.sg/osa/student-services/hostel-admission",
      },
      offCampus: {
        listingsUrl: "https://www.propertyguru.com.sg/room-rental",
        listingsPlatform: "PropertyGuru",
        neighborhoods: [
          { name: "Clementi", avgRent: "SGD $900/mo", distanceToCampus: "2 km" },
          { name: "Buona Vista", avgRent: "SGD $1,100/mo", distanceToCampus: "3 km" },
          { name: "Commonwealth", avgRent: "SGD $1,000/mo", distanceToCampus: "4 km" },
        ],
        housingPlaybookUrl: "https://nus.edu.sg/osa/student-services/hostel-admission/off-campus",
      },
    },
    "Melbourne, Australia": {
      onCampus: {
        firstYearGuarantee: true,
        residences: [
          { name: "International House", type: "Traditional", costPerYear: "AUD $18,000", includes: ["Meal plan", "Laundry", "Wi-Fi", "Mentoring"] },
          { name: "Graduate House", type: "Suite", costPerYear: "AUD $14,500", includes: ["Shared kitchen", "Common room", "Study spaces", "Central location"] },
          { name: "UniLodge", type: "Studio", costPerYear: "AUD $22,000", includes: ["Kitchenette", "Private bath", "Furnished", "All bills included"] },
        ],
        applicationUrl: "https://students.unimelb.edu.au/student-life/housing",
      },
      offCampus: {
        listingsUrl: "https://www.places4students.com/Places/School?SchoolID=5e9J2bWb5bc%3D",
        listingsPlatform: "Places4Students",
        neighborhoods: [
          { name: "Carlton", avgRent: "AUD $1,400/mo", distanceToCampus: "0.5 km" },
          { name: "Fitzroy", avgRent: "AUD $1,300/mo", distanceToCampus: "2 km" },
          { name: "North Melbourne", avgRent: "AUD $1,200/mo", distanceToCampus: "3 km" },
        ],
        housingPlaybookUrl: "https://students.unimelb.edu.au/student-life/housing/find-housing",
      },
    },
  };

  const cityKey = `${inst.city}, ${inst.country}`;
  const known = cityHousing[cityKey];

  if (known) return known;

  // Fallback generic housing info
  const currency = inst.country === "United Kingdom" ? "£" : inst.country === "Canada" ? "CAD $" : inst.country === "Australia" ? "AUD $" : inst.country === "India" ? "₹" : inst.country === "Switzerland" ? "CHF " : inst.country === "Singapore" ? "SGD $" : "$";
  const baseCost = inst.costOfLivingIndex > 1.4 ? 14000 : inst.costOfLivingIndex > 1.0 ? 10000 : 7000;

  return {
    onCampus: {
      firstYearGuarantee: inst.allowsInternationalStudents,
      residences: [
        { name: `${inst.name} Standard Hall`, type: "Traditional", costPerYear: `${currency}${baseCost.toLocaleString()}`, includes: ["Meal plan", "Wi-Fi", "Laundry", "Study rooms"] },
        { name: `${inst.name} Suite Residence`, type: "Suite", costPerYear: `${currency}${Math.round(baseCost * 1.3).toLocaleString()}`, includes: ["Private bath", "Common kitchen", "Lounge", "24/7 security"] },
        { name: `${inst.name} Apartments`, type: "Apartment", costPerYear: `${currency}${Math.round(baseCost * 1.6).toLocaleString()}`, includes: ["Full kitchen", "Private bath", "Furnished", "All utilities"] },
      ],
      applicationUrl: inst.website ? `${inst.website.replace(/\/$/, "")}/housing` : "#",
    },
    offCampus: {
      listingsUrl: `https://www.places4students.com/Places/SchoolSearch?q=${encodeURIComponent(inst.name)}`,
      listingsPlatform: "Places4Students",
      neighborhoods: [
        { name: `Near ${inst.name}`, avgRent: `${currency}${Math.round(baseCost / 12).toLocaleString()}/mo`, distanceToCampus: "1 km" },
        { name: `${inst.city} Central`, avgRent: `${currency}${Math.round(baseCost / 10).toLocaleString()}/mo`, distanceToCampus: "4 km" },
        { name: `Greater ${inst.city}`, avgRent: `${currency}${Math.round(baseCost / 14).toLocaleString()}/mo`, distanceToCampus: "8 km" },
      ],
      housingPlaybookUrl: inst.website ? `${inst.website.replace(/\/$/, "")}/off-campus-housing` : "#",
    },
  };
}

// ─── Room type config ───────────────────────────────────────────────────────

const ROOM_TYPE_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  Traditional: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100" },
  Suite: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-100" },
  Townhouse: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100" },
  Apartment: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" },
  Studio: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-100" },
};

// ─── Financing data builder ─────────────────────────────────────────────────

interface HomeLender {
  name: string;
  type: "National Bank" | "Private Bank" | "NBFC";
  interestRange: string;
  maxAmount: string;
  collateralRequired: boolean;
  coSignerRequired: boolean;
  processingTime: string;
  url: string;
}

interface DocumentItem {
  label: string;
  description: string;
  required: boolean;
}

interface FintechLender {
  name: string;
  tagline: string;
  noCoSigner: boolean;
  basedOn: string;
  url: string;
  countries: string[];
}

interface GICRequirement {
  required: boolean;
  amount: string;
  banks: { name: string; url: string }[];
  description: string;
}

interface FinancingInfo {
  homeCountryLenders: HomeLender[];
  documents: DocumentItem[];
  fintechLenders: FintechLender[];
  gicRequirement: GICRequirement | null;
  localCreditWarning: string;
}

function calculateLoanMargin(inst: Institution): { tuition: string; livingCost: string; total: string; currency: string } {
  const living = Math.round(25000 * inst.costOfLivingIndex);
  const total = inst.avgCost + living;
  const c = inst.country === "United Kingdom" ? "£" : inst.country === "Canada" ? "CAD $" : inst.country === "Australia" ? "AUD $" : inst.country === "Switzerland" ? "CHF " : inst.country === "Singapore" ? "SGD $" : "$";
  return {
    tuition: `${c}${inst.avgCost.toLocaleString()}`,
    livingCost: `${c}${living.toLocaleString()}`,
    total: `${c}${total.toLocaleString()}`,
    currency: c,
  };
}

function getHomeCountryLenders(country: string): HomeLender[] {
  const lendersByCountry: Record<string, HomeLender[]> = {
    India: [
      { name: "SBI Student Loan Scheme", type: "National Bank", interestRange: "8.15%–10.00%", maxAmount: "₹1.5 Crore", collateralRequired: true, coSignerRequired: true, processingTime: "15–20 business days", url: "https://sbi.co.in/web/personal-banking/loans/education-loans" },
      { name: "HDFC Credila", type: "NBFC", interestRange: "9.50%–13.25%", maxAmount: "₹45 Lakh (unsecured)", collateralRequired: false, coSignerRequired: true, processingTime: "7–14 business days", url: "https://www.hdfc.com/loans/education-loan" },
      { name: "Axis Bank Education Loan", type: "Private Bank", interestRange: "9.00%–13.70%", maxAmount: "No cap (with collateral)", collateralRequired: true, coSignerRequired: true, processingTime: "10–15 business days", url: "https://www.axisbank.com/retail/loans/education-loan" },
      { name: "IDFC FIRST Bank Scholar Loan", type: "Private Bank", interestRange: "8.75%–12.00%", maxAmount: "₹75 Lakh", collateralRequired: false, coSignerRequired: true, processingTime: "7–10 business days", url: "https://www.idfcfirstbank.com/personal-banking/loans/education-loan" },
    ],
    Nigeria: [
      { name: "Federal Government Student Loan (NELFUND)", type: "National Bank", interestRange: "0% (subsidized)", maxAmount: "₦5,000,000", collateralRequired: false, coSignerRequired: false, processingTime: "30–60 business days", url: "https://nelf.gov.ng/" },
      { name: "Access Bank Education Loan", type: "Private Bank", interestRange: "18%–22%", maxAmount: "₦10,000,000", collateralRequired: true, coSignerRequired: true, processingTime: "14–21 business days", url: "https://www.accessbankplc.com/" },
    ],
    Pakistan: [
      { name: "HEC Need Based Scholarship", type: "National Bank", interestRange: "0% (grant)", maxAmount: "PKR 2,000,000", collateralRequired: false, coSignerRequired: false, processingTime: "45–60 business days", url: "https://www.hec.gov.pk/english/scholarshipsgrants" },
      { name: "Meezan Bank Education Finance", type: "Private Bank", interestRange: "Shariah-compliant", maxAmount: "PKR 5,000,000", collateralRequired: true, coSignerRequired: true, processingTime: "15–20 business days", url: "https://www.meezanbank.com/" },
    ],
    Bangladesh: [
      { name: "Sonali Bank Education Loan", type: "National Bank", interestRange: "9%–12%", maxAmount: "BDT 30,00,000", collateralRequired: true, coSignerRequired: true, processingTime: "20–30 business days", url: "https://www.sonalibank.com.bd/" },
    ],
    Ghana: [
      { name: "GETFund Scholarship", type: "National Bank", interestRange: "0% (grant)", maxAmount: "Full tuition coverage", collateralRequired: false, coSignerRequired: false, processingTime: "60–90 business days", url: "https://getfund.gov.gh/" },
    ],
    China: [
      { name: "China Scholarship Council (CSC)", type: "National Bank", interestRange: "0% (grant)", maxAmount: "Full tuition + stipend", collateralRequired: false, coSignerRequired: false, processingTime: "60–90 business days", url: "https://www.csc.edu.cn/laihua/" },
      { name: "Bank of China Education Loan", type: "National Bank", interestRange: "4.35%–6.00%", maxAmount: "¥1,000,000", collateralRequired: true, coSignerRequired: true, processingTime: "15–25 business days", url: "https://www.boc.cn/" },
    ],
    Brazil: [
      { name: "FIES (Federal)", type: "National Bank", interestRange: "0% (subsidized)", maxAmount: "Full tuition", collateralRequired: false, coSignerRequired: true, processingTime: "30–45 business days", url: "https://fies.mec.gov.br/" },
      { name: "Bradesco Education Loan", type: "Private Bank", interestRange: "1.5%–3.0%/mo", maxAmount: "R$150,000", collateralRequired: true, coSignerRequired: true, processingTime: "10–15 business days", url: "https://banco.bradesco/" },
    ],
    "United States": [
      { name: "Federal Direct Loans (FAFSA)", type: "National Bank", interestRange: "5.50%–8.05%", maxAmount: "$20,500/yr (grad)", collateralRequired: false, coSignerRequired: false, processingTime: "3–6 weeks (after FAFSA)", url: "https://studentaid.gov/" },
      { name: "Sallie Mae", type: "Private Bank", interestRange: "4.50%–15.49%", maxAmount: "Cost of attendance", collateralRequired: false, coSignerRequired: true, processingTime: "15 business days", url: "https://www.salliemae.com/" },
    ],
    "United Kingdom": [
      { name: "UK Student Loans Company (SLC)", type: "National Bank", interestRange: "RPI-linked (~7.3%)", maxAmount: "£9,250/yr + maintenance", collateralRequired: false, coSignerRequired: false, processingTime: "6–8 weeks", url: "https://www.gov.uk/student-finance" },
    ],
  };

  return lendersByCountry[country] || [
    { name: `${country} National Education Loan`, type: "National Bank", interestRange: "Varies", maxAmount: "Contact bank", collateralRequired: true, coSignerRequired: true, processingTime: "15–30 business days", url: `https://www.google.com/search?q=${encodeURIComponent(country + " student education loan bank")}` },
  ];
}

function getDocumentChecklist(destCountry: string): DocumentItem[] {
  const base: DocumentItem[] = [
    { label: "Official Letter of Acceptance", description: "From a Designated Learning Institution (DLI) / accredited university", required: true },
    { label: "Academic Transcripts", description: "All semester mark sheets and degree certificates", required: true },
    { label: "Passport Copy", description: "Valid for at least 6 months beyond intended stay", required: true },
    { label: "Proof of Funds / Bank Statements", description: "Last 6–12 months showing sufficient balance", required: true },
    { label: "Income Tax Returns", description: "Last 2–3 years of co-signer/parent ITR filings", required: true },
    { label: "Collateral Documents", description: "Property valuation, FD receipts, or LIC policies (if collateral route)", required: false },
    { label: "Co-Borrower KYC", description: "PAN card, Aadhaar, and income proof of co-signer", required: true },
    { label: "Loan Application Form", description: "Completed and signed by borrower and co-borrower", required: true },
    { label: "Cost Estimate Sheet", description: "University-issued breakdown of tuition, fees, and living costs", required: true },
  ];

  if (destCountry === "Canada") {
    base.push({ label: "GIC Purchase Receipt", description: "Guaranteed Investment Certificate receipt from an approved Canadian bank", required: true });
  }

  return base;
}

const FINTECH_LENDERS: FintechLender[] = [
  {
    name: "MPOWER Financing",
    tagline: "No cosigner or collateral needed. Based on future earning potential.",
    noCoSigner: true,
    basedOn: "Future career earnings potential & school quality",
    url: "https://www.mpowerfinancing.com/",
    countries: ["India", "Nigeria", "Ghana", "Pakistan", "Bangladesh", "Brazil", "China", "Mexico", "Kenya", "Nepal"],
  },
  {
    name: "Prodigy Finance",
    tagline: "Borderless student loans for top-ranked international programs.",
    noCoSigner: true,
    basedOn: "Projected post-graduation salary & program ROI",
    url: "https://prodigyfinance.com/",
    countries: ["India", "Nigeria", "Ghana", "Pakistan", "Brazil", "China", "Mexico", "Kenya", "Bangladesh"],
  },
  {
    name: "Leap Finance",
    tagline: "AI-powered education loans for Indian students going abroad.",
    noCoSigner: true,
    basedOn: "University ranking, program, and career trajectory",
    url: "https://www.leapfinance.com/",
    countries: ["India"],
  },
  {
    name: "Stilt",
    tagline: "Personal loans for international students already in the US.",
    noCoSigner: true,
    basedOn: "Education, work authorization, and career potential",
    url: "https://www.stilt.com/",
    countries: ["India", "China", "Brazil", "Nigeria", "Pakistan"],
  },
];

function getGICRequirement(destCountry: string): GICRequirement | null {
  if (destCountry === "Canada") {
    return {
      required: true,
      amount: "CAD $20,635",
      banks: [
        { name: "Scotiabank", url: "https://www.scotiabank.com/ca/en/personal/international-students.html" },
        { name: "CIBC", url: "https://www.cibc.com/en/personal-banking/newcomers-to-canada/international-students.html" },
        { name: "BMO", url: "https://www.bmo.com/main/personal/newcomers-to-canada/international-students/" },
        { name: "ICICI Bank Canada", url: "https://www.icicibank.ca/personalbanking/gic.page" },
        { name: "SBI Canada Bank", url: "https://www.sbicanada.com/" },
      ],
      description: "A Guaranteed Investment Certificate (GIC) is a mandatory financial proof required by IRCC for your Canadian study permit. You must purchase a GIC from an approved Canadian bank. The funds are released in monthly installments after you arrive in Canada.",
    };
  }
  if (destCountry === "Australia") {
    return {
      required: true,
      amount: "AUD $29,710",
      banks: [
        { name: "Commonwealth Bank", url: "https://www.commbank.com.au/personal/international.html" },
        { name: "ANZ", url: "https://www.anz.com.au/personal/bank-accounts/international-students/" },
      ],
      description: "Australia requires proof of 12 months' living costs (AUD $29,710/yr) via a 'Genuine Temporary Entrant' financial statement. Funds must be held in an approved account or evidenced through bank statements.",
    };
  }
  return null;
}

function getLocalCreditWarning(destCountry: string): string {
  const warnings: Record<string, string> = {
    Canada: "Canadian banks (TD, RBC, Scotiabank) offer excellent student lines of credit (prime + 1%–3.5%), but almost universally require a Canadian citizen or permanent resident as a co-signer for risk assessment. International students without a local guarantor cannot access these products independently.",
    "United States": "US banks and credit unions offer competitive student loans, but nearly all private lenders require a US citizen or permanent resident co-signer. Federal loans (FAFSA) are only available to US citizens, nationals, and eligible non-citizens.",
    "United Kingdom": "UK high-street banks rarely offer education loans to international students. The Student Loans Company (SLC) covers UK/EU students only. International students must rely on home-country banks or global fintech lenders.",
    Australia: "Australian banks offer student lines of credit but require an Australian permanent resident or citizen guarantor. International students should explore home-country financing or fintech alternatives first.",
  };
  return warnings[destCountry] || `Local banks in ${destCountry} typically require a local citizen or permanent resident co-signer for student credit products. International students are advised to arrange primary financing from home-country or international fintech lenders.`;
}

function TransitIcon({ type }: { type: "bus" | "train" | "metro" }) {
  switch (type) {
    case "bus":
      return <Bus size={12} className="text-emerald-600" />;
    case "metro":
      return <Train size={12} className="text-violet-600" />;
    case "train":
    default:
      return <Train size={12} className="text-blue-600" />;
  }
}

// ─── Main Drawer Component ──────────────────────────────────────────────────

interface Props {
  institution: Institution;
  onClose: () => void;
  profile?: UserProfile;
}

export default function CampusAccessDrawer({ institution, onClose, profile }: Props) {
  const [activeTab, setActiveTab] = useState<"tours" | "transit" | "housing" | "finance">("tours");
  const [housingToggle, setHousingToggle] = useState<"on-campus" | "off-campus">("on-campus");
  const [financeToggle, setFinanceToggle] = useState<"path-a" | "path-b">("path-a");
  const tours = getVirtualTours(institution);
  const transit = getTransitInfo(institution);
  const housing = getHousingInfo(institution);

  const homeCountry = profile?.country || profile?.citizenCountry || "India";
  const loanMargin = calculateLoanMargin(institution);
  const homeLenders = getHomeCountryLenders(homeCountry);
  const documents = getDocumentChecklist(institution.country);
  const gic = getGICRequirement(institution.country);
  const relevantFintech = FINTECH_LENDERS.filter(l => l.countries.includes(homeCountry) || l.countries.length > 5);
  const creditWarning = getLocalCreditWarning(institution.country);

  const tabs = [
    { id: "tours" as const, label: "Tours", icon: Eye },
    { id: "transit" as const, label: "Transit", icon: Route },
    { id: "housing" as const, label: "Housing", icon: Home },
    { id: "finance" as const, label: "Finance", icon: Banknote },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1100] bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-indigo-50 to-white">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">
                  Campus Access & Transit
                </p>
                <h3 className="text-sm font-black text-slate-900 leading-tight truncate">
                  {institution.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <MapPin size={10} className="text-slate-400" />
                  <span className="text-[10px] text-slate-500 font-bold">
                    {institution.city}, {institution.country}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-all shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border shrink-0 whitespace-nowrap",
                    activeTab === id
                      ? "bg-indigo-600 text-white border-indigo-700 shadow-sm shadow-indigo-200"
                      : "bg-white text-slate-500 border-slate-200 hover:border-indigo-200"
                  )}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {activeTab === "tours" && (
              <div className="space-y-4">
                {/* Virtual Tour Links */}
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Available Campus Tours
                  </p>
                  <div className="space-y-2.5">
                    {tours.map((tour, i) => (
                      <a
                        key={i}
                        href={tour.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition-all group"
                      >
                        <div
                          className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                            tour.type === "official"
                              ? "bg-indigo-100 text-indigo-600"
                              : tour.type === "360"
                                ? "bg-violet-100 text-violet-600"
                                : "bg-rose-100 text-rose-600"
                          )}
                        >
                          {tour.type === "video" ? (
                            <Globe size={14} />
                          ) : (
                            <Eye size={14} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black text-slate-800 truncate group-hover:text-indigo-700 transition-colors">
                            {tour.label}
                          </p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            {tour.type === "official"
                              ? "Official University Tour"
                              : tour.type === "360"
                                ? "360° Interactive Tour"
                                : "Video Tour"}
                          </p>
                        </div>
                        <ExternalLink
                          size={12}
                          className="text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0"
                        />
                      </a>
                    ))}
                  </div>
                </div>

                {/* Google Maps Embed */}
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Campus Location
                  </p>
                  <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                    <iframe
                      title={`${institution.name} Map`}
                      width="100%"
                      height="220"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY || ''}&q=${encodeURIComponent(institution.name + ", " + institution.city)}&center=${institution.coordinates.lat},${institution.coordinates.lng}&zoom=14`}
                    />
                  </div>
                  <a
                    href={transit.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[9px] font-black text-slate-500 uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                  >
                    <Navigation size={10} />
                    Open in Google Maps
                  </a>
                </div>
              </div>
            )}

            {activeTab === "transit" && (
              <div className="space-y-5">
                {/* Proximity Metrics */}
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Proximity Metrics
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Airport */}
                    <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-100">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Plane size={12} className="text-sky-600" />
                        <span className="text-[8px] font-black text-sky-600 uppercase tracking-widest">
                          Airport
                        </span>
                      </div>
                      <p className="text-xs font-black text-slate-800 leading-tight">
                        {transit.nearestAirport.name}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="flex items-center gap-1 text-[9px] font-bold text-slate-500">
                          <MapPin size={8} />
                          {transit.nearestAirport.distance}
                        </span>
                        <span className="flex items-center gap-1 text-[9px] font-bold text-sky-700">
                          <Clock size={8} />
                          {transit.nearestAirport.time}
                        </span>
                      </div>
                    </div>

                    {/* Station */}
                    <div className="p-3.5 rounded-2xl bg-violet-50 border border-violet-100">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Train size={12} className="text-violet-600" />
                        <span className="text-[8px] font-black text-violet-600 uppercase tracking-widest">
                          Station
                        </span>
                      </div>
                      <p className="text-xs font-black text-slate-800 leading-tight">
                        {transit.nearestStation.name}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="flex items-center gap-1 text-[9px] font-bold text-slate-500">
                          <MapPin size={8} />
                          {transit.nearestStation.distance}
                        </span>
                        <span className="flex items-center gap-1 text-[9px] font-bold text-violet-700">
                          <Clock size={8} />
                          {transit.nearestStation.time}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Proximity snippet */}
                  <div className="mt-3 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                    <p className="text-[10px] font-bold text-indigo-700 leading-relaxed">
                      📍 <strong>{transit.nearestStation.time}</strong> from the nearest transit station · <strong>{transit.nearestAirport.time}</strong> from the nearest international airport.
                    </p>
                  </div>
                </div>

                {/* Local Transit Options */}
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Local Transit Options
                  </p>
                  <div className="space-y-2">
                    {transit.localTransit.map((line, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-all"
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                            line.type === "bus"
                              ? "bg-emerald-50"
                              : line.type === "metro"
                                ? "bg-violet-50"
                                : "bg-blue-50"
                          )}
                        >
                          <TransitIcon type={line.type} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black text-slate-800 truncate">
                            {line.name}
                          </p>
                          <p className="text-[9px] text-slate-400 font-medium truncate">
                            {line.route}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md shrink-0",
                            line.type === "bus"
                              ? "bg-emerald-50 text-emerald-600"
                              : line.type === "metro"
                                ? "bg-violet-50 text-violet-600"
                                : "bg-blue-50 text-blue-600"
                          )}
                        >
                          {line.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Google Maps transit directions */}
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Transit Directions
                  </p>
                  <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                    <iframe
                      title={`Transit to ${institution.name}`}
                      width="100%"
                      height="220"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps/embed/v1/directions?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY || ''}&destination=${encodeURIComponent(institution.name + ", " + institution.city)}&origin=${encodeURIComponent(institution.city + " Airport")}&mode=transit`}
                    />
                  </div>
                  <a
                    href={transit.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-sm shadow-indigo-200"
                  >
                    <Navigation size={10} />
                    Get Transit Directions
                  </a>
                </div>
              </div>
            )}

            {activeTab === "housing" && (
              <div className="space-y-4">
                {/* On-Campus / Off-Campus Toggle */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setHousingToggle("on-campus")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                      housingToggle === "on-campus"
                        ? "bg-white text-indigo-700 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <Building size={11} />
                    On-Campus
                  </button>
                  <button
                    onClick={() => setHousingToggle("off-campus")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                      housingToggle === "off-campus"
                        ? "bg-white text-indigo-700 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <Home size={11} />
                    Off-Campus
                  </button>
                </div>

                {/* ── On-Campus Content ── */}
                {housingToggle === "on-campus" && (
                  <div className="space-y-4">
                    {/* First-Year Guarantee Tag */}
                    {housing.onCampus.firstYearGuarantee && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                        <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                        <div>
                          <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">
                            First-Year Residence Guarantee
                          </p>
                          <p className="text-[9px] text-emerald-600 font-medium mt-0.5">
                            All incoming first-year students are guaranteed on-campus housing when applied before the deadline.
                          </p>
                        </div>
                      </div>
                    )}

                    {!housing.onCampus.firstYearGuarantee && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                        <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                        <div>
                          <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">
                            No First-Year Guarantee
                          </p>
                          <p className="text-[9px] text-amber-600 font-medium mt-0.5">
                            On-campus housing is allocated on a first-come, first-served basis. Apply early.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Residence Room Styles */}
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                        Available Room Styles
                      </p>
                      <div className="space-y-2.5">
                        {housing.onCampus.residences.map((room, i) => {
                          const cfg = ROOM_TYPE_CONFIG[room.type] || ROOM_TYPE_CONFIG["Traditional"];
                          return (
                            <div
                              key={i}
                              className={cn("p-3.5 rounded-2xl border bg-white hover:shadow-sm transition-all", cfg.border)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className={cn("text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md", cfg.bg, cfg.text)}>
                                      {room.type}
                                    </span>
                                  </div>
                                  <p className="text-[11px] font-black text-slate-800 leading-tight">
                                    {room.name}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-xs font-black text-indigo-700">{room.costPerYear}</p>
                                  <p className="text-[8px] text-slate-400 font-bold">/academic year</p>
                                </div>
                              </div>
                              <ul className="space-y-1 mt-2.5 pt-2.5 border-t border-slate-50">
                                {room.includes.map((item, j) => (
                                  <li key={j} className="flex items-center gap-1.5 text-[9px] text-slate-500 font-medium">
                                    <CheckCircle size={8} className="text-emerald-500 shrink-0" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Apply Button */}
                    <a
                      href={housing.onCampus.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-sm shadow-indigo-200"
                    >
                      <ExternalLink size={10} />
                      Apply for On-Campus Housing
                    </a>
                  </div>
                )}

                {/* ── Off-Campus Content ── */}
                {housingToggle === "off-campus" && (
                  <div className="space-y-4">
                    {/* Scam Prevention Alert */}
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                      <div className="flex items-start gap-2.5">
                        <Shield size={16} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1">
                            International Student Housing Safety
                          </p>
                          <p className="text-[9px] text-amber-700 font-medium leading-relaxed mb-2">
                            Before signing any lease, learn how to verify landlords, read lease agreements, and avoid common rental scams targeting international students.
                          </p>
                          <a
                            href={housing.offCampus.housingPlaybookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-[8px] font-black uppercase tracking-widest hover:bg-amber-500 transition-all"
                          >
                            <Shield size={9} />
                            Read the Housing Playbook
                            <ExternalLink size={8} />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Vetted Listings Widget */}
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                        Verified Student Listings
                      </p>
                      <a
                        href={housing.offCampus.listingsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 rounded-2xl border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-200 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                          <Home size={16} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black text-indigo-800 group-hover:text-indigo-900 transition-colors">
                            Browse on {housing.offCampus.listingsPlatform}
                          </p>
                          <p className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">
                            Vetted · Real-time vacancies · Student-verified
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Star size={9} className="text-amber-500 fill-amber-500" />
                          <span className="text-[8px] font-black text-indigo-500 uppercase">Trusted</span>
                        </div>
                        <ExternalLink size={12} className="text-indigo-300 group-hover:text-indigo-600 transition-colors shrink-0" />
                      </a>
                    </div>

                    {/* Average Rent by Neighborhood */}
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                        Average Local Rent by Area
                      </p>
                      <div className="space-y-2">
                        {housing.offCampus.neighborhoods.map((hood, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-all"
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                              i === 0 ? "bg-emerald-50" : i === 1 ? "bg-blue-50" : "bg-violet-50"
                            )}>
                              <MapPin size={12} className={i === 0 ? "text-emerald-600" : i === 1 ? "text-blue-600" : "text-violet-600"} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-black text-slate-800 truncate">
                                {hood.name}
                              </p>
                              <p className="text-[8px] text-slate-400 font-bold">
                                {hood.distanceToCampus} from campus
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[11px] font-black text-indigo-700">{hood.avgRent}</p>
                              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Avg Rent</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Search on Google Maps */}
                    <a
                      href={`https://www.google.com/maps/search/student+housing+near+${encodeURIComponent(institution.name + ", " + institution.city)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[9px] font-black text-slate-500 uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                    >
                      <Navigation size={10} />
                      Search Housing on Google Maps
                    </a>
                  </div>
                )}
              </div>
            )}

            {activeTab === "finance" && (
              <div className="space-y-4">
                {/* Path A / Path B Toggle */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setFinanceToggle("path-a")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                      financeToggle === "path-a"
                        ? "bg-white text-indigo-700 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <Landmark size={11} />
                    Home-Country
                  </button>
                  <button
                    onClick={() => setFinanceToggle("path-b")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                      financeToggle === "path-b"
                        ? "bg-white text-indigo-700 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <Zap size={11} />
                    No Co-Signer
                  </button>
                </div>

                {/* ── Path A: Home-Country Lenders ── */}
                {financeToggle === "path-a" && (
                  <div className="space-y-4">
                    {/* Country indicator */}
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                      <Globe size={14} className="text-indigo-600 shrink-0" />
                      <div>
                        <p className="text-[10px] font-black text-indigo-800 uppercase tracking-widest">
                          Financing from {homeCountry}
                        </p>
                        <p className="text-[9px] text-indigo-600 font-medium mt-0.5">
                          Collateral &amp; co-signer route for students applying from {homeCountry}
                        </p>
                      </div>
                    </div>

                    {/* Step 1: Cost Validation (Auto-calculated) */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[8px] font-black shrink-0">1</div>
                        <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Cost Validation — Required Loan Margin</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500">Annual Tuition Fees</span>
                          <span className="text-[11px] font-black text-slate-800">{loanMargin.tuition}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500">International Living Costs (est.)</span>
                          <span className="text-[11px] font-black text-slate-800">{loanMargin.livingCost}</span>
                        </div>
                        <div className="border-t border-slate-200 pt-2 mt-2 flex items-center justify-between">
                          <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Total Loan Margin Required</span>
                          <span className="text-sm font-black text-indigo-700">{loanMargin.total}</span>
                        </div>
                        <p className="text-[8px] text-slate-400 font-medium pt-1">
                          Based on {institution.name} tuition + regional COL index ({institution.costOfLivingIndex}x)
                        </p>
                      </div>
                    </div>

                    {/* Step 2: Document Checklist */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[8px] font-black shrink-0">2</div>
                        <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Document Check — Upload Checklist</p>
                      </div>
                      <div className="space-y-1.5">
                        {documents.map((doc, i) => (
                          <div
                            key={i}
                            className={cn(
                              "flex items-start gap-2.5 p-2.5 rounded-xl border transition-all",
                              doc.required
                                ? "bg-white border-slate-100"
                                : "bg-slate-50 border-dashed border-slate-200"
                            )}
                          >
                            <div className={cn(
                              "w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5",
                              doc.required ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"
                            )}>
                              {doc.required ? <FileCheck size={10} /> : <Upload size={10} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-[10px] font-black text-slate-800">{doc.label}</p>
                                {doc.required && (
                                  <span className="text-[7px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded uppercase tracking-widest">Required</span>
                                )}
                                {!doc.required && (
                                  <span className="text-[7px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-widest">If applicable</span>
                                )}
                              </div>
                              <p className="text-[8px] text-slate-400 font-medium mt-0.5">{doc.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Step 3: Co-Signer Assignment */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[8px] font-black shrink-0">3</div>
                        <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Co-Signer &amp; Collateral Assignment</p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                        <div className="flex items-start gap-2.5">
                          <Shield size={14} className="text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] font-black text-amber-800 mb-1">Co-Borrower &amp; Collateral Details</p>
                            <ul className="space-y-1.5">
                              <li className="flex items-start gap-1.5 text-[9px] text-amber-700 font-medium">
                                <ArrowRight size={8} className="shrink-0 mt-0.5" />
                                Nominate a parent/guardian as co-borrower with verified income proof
                              </li>
                              <li className="flex items-start gap-1.5 text-[9px] text-amber-700 font-medium">
                                <ArrowRight size={8} className="shrink-0 mt-0.5" />
                                Submit property documents, FD receipts, or insurance policies as collateral (for loans above unsecured limits)
                              </li>
                              <li className="flex items-start gap-1.5 text-[9px] text-amber-700 font-medium">
                                <ArrowRight size={8} className="shrink-0 mt-0.5" />
                                Banks require co-signer's KYC, income proof, and credit score verification
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 4: Available Lenders + Disbursement */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[8px] font-black shrink-0">4</div>
                        <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Lenders &amp; Disbursement</p>
                      </div>
                      <div className="space-y-2.5">
                        {homeLenders.map((lender, i) => (
                          <a
                            key={i}
                            href={lender.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3.5 rounded-2xl border border-slate-100 bg-white hover:bg-indigo-50 hover:border-indigo-200 transition-all group"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className={cn(
                                    "text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                                    lender.type === "National Bank" ? "bg-blue-50 text-blue-700" : lender.type === "NBFC" ? "bg-violet-50 text-violet-700" : "bg-emerald-50 text-emerald-700"
                                  )}>
                                    {lender.type}
                                  </span>
                                  {!lender.collateralRequired && (
                                    <span className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
                                      No Collateral
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] font-black text-slate-800 group-hover:text-indigo-700 transition-colors">
                                  {lender.name}
                                </p>
                              </div>
                              <ExternalLink size={11} className="text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0 mt-1" />
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div className="p-2 rounded-lg bg-slate-50">
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Interest</p>
                                <p className="text-[10px] font-black text-slate-700">{lender.interestRange}</p>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-50">
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Max Amount</p>
                                <p className="text-[10px] font-black text-slate-700">{lender.maxAmount}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 mt-2 text-[8px] text-slate-400 font-bold">
                              <Clock size={8} />
                              Processing: {lender.processingTime}
                            </div>
                            <div className="mt-2 pt-2 border-t border-slate-50 text-[8px] text-slate-400 font-medium">
                              Disbursement: Direct wire transfer to {institution.name}'s international student accounts
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Path B: International Fintech Lenders ── */}
                {financeToggle === "path-b" && (
                  <div className="space-y-4">
                    {/* Path B header */}
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-violet-50 border border-violet-100">
                      <Zap size={14} className="text-violet-600 shrink-0" />
                      <div>
                        <p className="text-[10px] font-black text-violet-800 uppercase tracking-widest">
                          No Co-Signer Route
                        </p>
                        <p className="text-[9px] text-violet-600 font-medium mt-0.5">
                          Global fintech lenders that assess your future career potential instead of physical collateral
                        </p>
                      </div>
                    </div>

                    {/* Fintech Lender Cards */}
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                        Future Potential Evaluation Lenders
                      </p>
                      <div className="space-y-2.5">
                        {(relevantFintech.length > 0 ? relevantFintech : FINTECH_LENDERS.slice(0, 2)).map((lender, i) => (
                          <a
                            key={i}
                            href={lender.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-4 rounded-2xl border border-violet-100 bg-white hover:bg-violet-50 hover:border-violet-200 transition-all group"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1">
                                    <CheckCircle size={7} />No Co-Signer
                                  </span>
                                  <span className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1">
                                    <CheckCircle size={7} />No Collateral
                                  </span>
                                </div>
                                <p className="text-[12px] font-black text-slate-800 group-hover:text-violet-700 transition-colors">
                                  {lender.name}
                                </p>
                                <p className="text-[9px] text-slate-500 font-medium mt-0.5">
                                  {lender.tagline}
                                </p>
                              </div>
                              <ExternalLink size={12} className="text-slate-300 group-hover:text-violet-500 transition-colors shrink-0 mt-1" />
                            </div>
                            <div className="mt-2 p-2.5 rounded-xl bg-violet-50 border border-violet-100">
                              <p className="text-[8px] font-black text-violet-600 uppercase tracking-widest mb-0.5">Eligibility Based On</p>
                              <p className="text-[9px] text-violet-700 font-bold">{lender.basedOn}</p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* Local Line of Credit Warning */}
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                        Local Credit — Important Notice
                      </p>
                      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                            <Info size={14} className="text-amber-600" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                              <Lock size={9} />
                              Co-Signer Requirement
                            </p>
                            <p className="text-[9px] text-amber-700 font-medium leading-relaxed">
                              {creditWarning}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* GIC / Regulatory Prerequisite */}
                    {gic && (
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                          <AlertTriangle size={10} className="text-rose-500" />
                          Mandatory Regulatory Prerequisite
                        </p>
                        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                          <div className="flex items-center gap-2 mb-3">
                            <CircleDollarSign size={16} className="text-rose-600" />
                            <div>
                              <p className="text-[11px] font-black text-rose-800">
                                {institution.country === "Canada" ? "Guaranteed Investment Certificate (GIC)" : "Proof of Living Costs"}
                              </p>
                              <p className="text-[9px] font-bold text-rose-600">
                                Required amount: <span className="font-black">{gic.amount}</span>
                              </p>
                            </div>
                          </div>
                          <p className="text-[9px] text-rose-700 font-medium leading-relaxed mb-3">
                            {gic.description}
                          </p>
                          <div>
                            <p className="text-[8px] font-black text-rose-600 uppercase tracking-widest mb-2">
                              Approved Banks to Purchase
                            </p>
                            <div className="space-y-1.5">
                              {gic.banks.map((bank, i) => (
                                <a
                                  key={i}
                                  href={bank.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-rose-100 hover:border-rose-300 hover:bg-rose-50 transition-all group"
                                >
                                  <div className="flex items-center gap-2">
                                    <Landmark size={11} className="text-rose-500" />
                                    <span className="text-[10px] font-black text-slate-800 group-hover:text-rose-700 transition-colors">{bank.name}</span>
                                  </div>
                                  <ExternalLink size={10} className="text-slate-300 group-hover:text-rose-500 transition-colors" />
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Auto-calculated cost summary */}
                    <div className="p-4 rounded-2xl bg-indigo-600 text-white">
                      <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">Total Capital Required</p>
                      <p className="text-xl font-black">{loanMargin.total}</p>
                      <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
                        <div className="flex justify-between text-[9px] font-bold">
                          <span className="text-indigo-200">Tuition</span>
                          <span>{loanMargin.tuition}</span>
                        </div>
                        <div className="flex justify-between text-[9px] font-bold">
                          <span className="text-indigo-200">Living Costs</span>
                          <span>{loanMargin.livingCost}</span>
                        </div>
                        {gic && (
                          <div className="flex justify-between text-[9px] font-bold">
                            <span className="text-indigo-200">{institution.country === "Canada" ? "GIC" : "Living Proof"}</span>
                            <span>{gic.amount}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
