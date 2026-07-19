import type {
  AppNotification,
  Booking,
  AssignedOffer,
  AssignedOfferStatus,
  Game,
  MenuItem,
  Offer,
  Order,
  PlatformUser,
  ScanLogEntry,
  Venue,
  VenueEvent,
  LeaderboardEntry, 
  Player, 
  Question, 
  QuestionType,
  Quiz, 
  QuizDifficulty,
  QuizEntryMethod, 
  QuizRewardType, 
  QuizSession, 
  QuizSettings, 
  QuizStatus, 
  Reward,
} from "@/types";


export const DEMO_VENUE_ID = "venue-1";

export interface MockDb {
  orders: Order[];
  menu: MenuItem[];
  events: VenueEvent[];
  games: Game[];
  users: PlatformUser[];
  bookings: Booking[];
  notifications: AppNotification[];
  scanLogs: ScanLogEntry[];
  venues: Venue[];
  platformUsers: PlatformUser[];
  offers: Offer[];
  /** Flat User<->Offer relationship table — the single source of truth for assigned offers. */
  assignedOffers: AssignedOffer[];
  /* Quiz Panel */
  quizzes: Quiz[];
  questions: Question[];
  quizSessions: QuizSession[];
  quizPlayers: Player[];
  quizRewards: Reward[];
  quizSettings: QuizSettings;
  /** Final ranking snapshot for each ended/live session, keyed by session id. */
  sessionLeaderboards: Record<string, LeaderboardEntry[]>;
}

function daysFromNow(days: number, hour = 19): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function minutesAgo(min: number): string {
  return new Date(Date.now() - min * 60_000).toISOString();
}

const firstNames = [
  "James", "Olivia", "Liam", "Emma", "Noah", "Ava", "Lucas", "Sophia",
  "Mason", "Isabella", "Ethan", "Mia", "Logan", "Amelia", "Jack", "Harper",
];
const lastNames = [
  "Carter", "Bennett", "Walsh", "Reyes", "Foster", "Nguyen", "Brooks",
  "Diaz", "Murphy", "Cole", "Hughes", "Patel", "Ward", "Khan", "Stone",
];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function name(i: number): string {
  return `${pick(firstNames, i)} ${pick(lastNames, i * 3 + 1)}`;
}

const menuCatalog: Array<[string, string, number]> = [
  ["Classic Burger", "Mains", 14],
  ["BBQ Wings (12pc)", "Starters", 12],
  ["Loaded Nachos", "Starters", 11],
  ["Margherita Pizza", "Mains", 16],
  ["Crispy Calamari", "Starters", 13],
  ["Pulled Pork Sliders", "Mains", 15],
  ["Caesar Salad", "Salads", 10],
  ["Truffle Fries", "Sides", 8],
  ["Draft Lager (Pint)", "Drinks", 7],
  ["House IPA (Pint)", "Drinks", 8],
  ["Old Fashioned", "Cocktails", 12],
  ["Margarita", "Cocktails", 11],
  ["Soft Drink", "Drinks", 4],
  ["Chocolate Brownie", "Desserts", 7],
  ["Buffalo Cauliflower", "Starters", 10],
];

const orderStatuses: Order["status"][] = [
  "Paid", "Order Recived", "Cancelled",
];

/**
 * Deterministically decide, for demo-seeding purposes, how many offers (and which ones,
 * from the already-created `offers` catalog) a given user index should have assigned.
 * Real assignments always go through `assignedOffersService.assign`.
 */
function buildAssignedOffersForUser(
  userId: string,
  i: number,
  offers: Offer[],
): AssignedOffer[] {
  const count = i % 5; // yields a mix of 0, 1, 2, 3, 4 offers per user
  const statuses: AssignedOfferStatus[] = ["Assigned", "Used", "Expired", "Cancelled"];
  return Array.from({ length: count }).map((_, j) => {
    const offer = offers[(i + j) % offers.length];
    const assignedDaysAgo = i + j * 3 + 1;
    const assignedAt = daysFromNow(-assignedDaysAgo, 10 + (j % 8));
    const validFrom = daysFromNow(-assignedDaysAgo + 1, 0);
    const expiryDate = daysFromNow(-assignedDaysAgo + 4, 23);
    const status = statuses[(i + j) % statuses.length];
    return {
      id: `uoff-${i}-${j}`,
      userId,
      offerId: offer.id,
      name: offer.name,
      type: offer.type,
      code: offer.code,
      discountSummary: offerBenefitSummary(offer),
      description: offer.description,
      assignedAt,
      validFrom,
      expiryDate,
      status,
      usedAt: status === "Used" ? daysFromNow(-assignedDaysAgo + 2, 12 + (j % 6)) : null,
      venueId: offer.venueId,
    };
  });
}

function offerBenefitSummary(o: Offer): string {
  switch (o.type) {
    case "Flat Discount":
      return `$${o.discountValue ?? 0} off`;
    case "Percentage Discount":
      return `${o.discountValue ?? 0}% off`;
    case "Cashback":
      return `$${o.discountValue ?? 0} cashback`;
    case "Free Item":
      return `Free ${o.freeItemName || "item"}`;
    case "Coupon Code":
      return o.code ? `Code: ${o.code}` : "Coupon";
    default:
      return o.benefitDetails || o.type;
  }
}

const QUIZ_CATEGORIES = [
  "Sports Trivia", "Movies", "Music", "General Knowledge",
  "History", "Science", "Geography", "Pop Culture",
];

const QUIZ_DIFFICULTIES: QuizDifficulty[] = ["Easy", "Medium", "Hard"];
const QUESTION_TYPES: QuestionType[] = [
  "MCQ", "True/False", "Multiple Correct", "Image Question", "Logo Quiz", "Poll", "Survey",
];
const REWARD_TYPES: QuizRewardType[] = [
  "Coupon", "Offer", "Free Drink", "Free Food", "Loyalty Points", "Gift Voucher",
];
const ENTRY_METHODS: QuizEntryMethod[] = ["QR Code", "PIN Code", "Invite Only"];

function pinCode(seedNum: number): string {
  return String(100000 + (seedNum * 9301 + 49297) % 900000);
}

function questionBank(venueId: string): Question[] {
  const templates = [
    "Which team won the {category} championship in {year}?",
    "Who holds the record for most points in {category} history?",
    "In what year did the famous {category} event take place?",
    "Which of these belongs to the {category} category?",
    "What is the correct answer about {category}?",
  ];
  return Array.from({ length: 300 }).map((_, i) => {
    const category = pick(QUIZ_CATEGORIES, i);
    const difficulty = pick(QUIZ_DIFFICULTIES, i * 2 + 1);
    const type = pick(QUESTION_TYPES, i);
    const year = 1990 + (i % 34);
    const text = pick(templates, i)
      .replace("{category}", category)
      .replace("{year}", String(year));

    let options: { id: string; label: string }[];
    let correctOptionIds: string[] = [];

    if (type === "True/False") {
      options = [{ id: "A", label: "True" }, { id: "B", label: "False" }];
      correctOptionIds = [i % 2 === 0 ? "A" : "B"];
    } else if (type === "Poll" || type === "Survey") {
      options = [
        { id: "A", label: "Option A" }, { id: "B", label: "Option B" },
        { id: "C", label: "Option C" }, { id: "D", label: "Option D" },
      ];
      correctOptionIds = [];
    } else if (type === "Multiple Correct") {
      options = [
        { id: "A", label: `${category} Fact A` }, { id: "B", label: `${category} Fact B` },
        { id: "C", label: `${category} Fact C` }, { id: "D", label: `${category} Fact D` },
      ];
      correctOptionIds = i % 2 === 0 ? ["A", "C"] : ["B", "D"];
    } else {
      options = [
        { id: "A", label: `${category} Answer A` }, { id: "B", label: `${category} Answer B` },
        { id: "C", label: `${category} Answer C` }, { id: "D", label: `${category} Answer D` },
      ];
      correctOptionIds = [pick(["A", "B", "C", "D"], i)];
    }

    return {
      id: `q-${i + 1}`,
      text,
      imageUrl: type === "Image Question" || type === "Logo Quiz" ? `https://picsum.photos/seed/quiz${i}/400/240` : undefined,
      type,
      options,
      correctOptionIds,
      timeLimitSeconds: pick([10, 15, 20, 30, 45, 60], i),
      points: pick([500, 750, 1000, 1500], i * 3),
      explanation: `The correct answer relates to ${category} (${difficulty} difficulty).`,
      category,
      difficulty,
      tags: [category.toLowerCase().replace(/\s+/g, "-"), difficulty.toLowerCase()],
      usageCount: (i * 7) % 40,
      enabled: i % 17 !== 0,
      createdAt: daysFromNow(-(i % 120 + 1), 9),
      venueId,
    };
  });
}

function quizCatalog(venueId: string, questions: Question[]): Quiz[] {
  const statuses: QuizStatus[] = ["Draft", "Published", "Live", "Archived"];
  return Array.from({ length: 20 }).map((_, i) => {
    const category = pick(QUIZ_CATEGORIES, i);
    const pool = questions.filter((q) => q.category === category && q.enabled);
    const count = Math.min(12, Math.max(6, pool.length));
    const questionIds = pool.slice(0, count).map((q) => q.id);
    // Only one quiz is ever "Live" in the demo dataset (index 0).
    const status: QuizStatus = i === 0 ? "Live" : statuses[(i + 1) % statuses.length] === "Live" ? "Published" : statuses[(i + 1) % statuses.length];

    return {
      id: `quiz-${i + 1}`,
      name: `${category} Trivia Night ${i % 4 === 0 ? "Special" : `Vol. ${i + 1}`}`,
      description: `A ${pick(QUIZ_DIFFICULTIES, i)}-difficulty ${category.toLowerCase()} quiz for match nights.`,
      category,
      difficulty: pick(QUIZ_DIFFICULTIES, i),
      visibility: i % 4 === 0 ? "Private" : "Public",
      entryMethod: pick(ENTRY_METHODS, i),
      maxPlayers: pick([20, 30, 50, 100], i),
      rewardType: pick(REWARD_TYPES, i),
      startDate: daysFromNow(i - 10, 18),
      endDate: daysFromNow(i - 10, 20),
      shuffleQuestions: i % 2 === 0,
      shuffleOptions: i % 3 !== 0,
      allowLateJoin: i % 2 === 0,
      showLeaderboard: true,
      enableTimer: true,
      autoNextQuestion: i % 2 === 0,
      questionIds,
      playersCount: 10 + ((i * 13) % 90),
      status,
      pinCode: pinCode(i + 1),
      createdAt: daysFromNow(-(i * 4 + 5), 9),
      venueId,
    };
  });
}

function quizPlayerRoster(venueId: string): Player[] {
  const colors = ["#f97316", "#3b82f6", "#22c55e", "#a855f7", "#ec4899", "#06b6d4", "#eab308"];
  return Array.from({ length: 100 }).map((_, i) => ({
    id: `qp-${i + 1}`,
    name: name(i + 40),
    tableNumber: `T${1 + (i % 24)}`,
    avatarColor: pick(colors, i),
    totalScore: (i * 137) % 15000,
    quizzesPlayed: 1 + (i % 22),
    wins: i % 9 === 0 ? 1 + (i % 4) : 0,
    joinedAt: daysFromNow(-(i % 200 + 1), 12),
    status: i % 29 === 0 ? "Banned" : "Active",
    connectionStatus: i % 11 === 0 ? "Disconnected" : "Connected",
    venueId,
  }));
}

function quizSessionsAndLeaderboards(
  venueId: string,
  quizzes: Quiz[],
  players: Player[],
): { sessions: QuizSession[]; leaderboards: Record<string, LeaderboardEntry[]> } {
  const sessions: QuizSession[] = [];
  const leaderboards: Record<string, LeaderboardEntry[]> = {};

  for (let i = 0; i < 50; i++) {
    const quiz = pick(quizzes, i);
    const sessionPlayers = Array.from({ length: 8 + (i % 12) }).map((_, j) => pick(players, i * 5 + j));
    const uniquePlayers = Array.from(new Map(sessionPlayers.map((p) => [p.id, p])).values());

    const session: QuizSession = {
      id: `sess-${i + 1}`,
      quizId: quiz.id,
      quizName: quiz.name,
      status: "Ended",
      pinCode: quiz.pinCode,
      currentQuestionIndex: quiz.questionIds.length - 1,
      startedAt: daysFromNow(-(i + 1), 19),
      endedAt: daysFromNow(-(i + 1), 20),
      playerIds: uniquePlayers.map((p) => p.id),
      venueId,
    };
    sessions.push(session);

    const board: LeaderboardEntry[] = uniquePlayers
      .map((p, rank) => ({
        playerId: p.id,
        playerName: p.name,
        score: 1000 + ((i * 37 + rank * 211) % 9000),
        correctAnswers: 3 + ((i + rank) % 9),
        fastestResponseMs: 900 + ((i * 53 + rank * 97) % 4000),
        rank: 0,
        rankChange: (rank % 3) - 1,
      }))
      .sort((a, b) => b.score - a.score)
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

    leaderboards[session.id] = board;
  }

  return { sessions, leaderboards };
}

function quizRewardsFromSessions(
  quizzes: Quiz[],
  sessions: QuizSession[],
  leaderboards: Record<string, LeaderboardEntry[]>,
): Reward[] {
  const rewards: Reward[] = [];
  for (const session of sessions) {
    const quiz = quizzes.find((q) => q.id === session.quizId);
    if (!quiz) continue;
    const board = leaderboards[session.id] ?? [];
    const topN = board.slice(0, 3);
    topN.forEach((entry, idx) => {
      rewards.push({
        id: `reward-${session.id}-${entry.playerId}`,
        playerId: entry.playerId,
        playerName: entry.playerName,
        sessionId: session.id,
        quizName: quiz.name,
        type: quiz.rewardType,
        description: `${quiz.rewardType} for finishing #${idx + 1} in ${quiz.name}`,
        rank: idx + 1,
        assignedAt: session.endedAt ?? session.startedAt ?? new Date().toISOString(),
        status: idx === 0 ? "Delivered" : "Pending",
        venueId: quiz.venueId,
      });
    });
  }
  return rewards;
}

function seedQuizModule(venueId: string) {
  const questions = questionBank(venueId);
  const quizzes = quizCatalog(venueId, questions);
  const quizPlayers = quizPlayerRoster(venueId);
  const { sessions: quizSessions, leaderboards: sessionLeaderboards } =
    quizSessionsAndLeaderboards(venueId, quizzes, quizPlayers);
  const quizRewards = quizRewardsFromSessions(quizzes, quizSessions, sessionLeaderboards);
  const quizSettings: QuizSettings = {
    defaultTimerSeconds: 20,
    defaultPoints: 1000,
    shuffleQuestions: true,
    shuffleOptions: true,
    showCorrectAnswer: true,
    enableSounds: true,
    enableCountdown: true,
    maxPlayers: 100,
    allowRejoin: true,
    enableQrJoin: true,
    autoLeaderboard: true,
    venueId,
  };

  return { questions, quizzes, quizPlayers, quizSessions, sessionLeaderboards, quizRewards, quizSettings };
}

function seed(): MockDb {
  const menu: MenuItem[] = menuCatalog.map(([n, category, price], i) => ({
    id: `menu-${i + 1}`,
    name: n,
    category,
    price,
    stock: i % 5 === 0 ? 4 : 20 + (i % 7) * 6,
    outOfStock: i === 4,
    enabled: i !== 11,
    description: `Freshly prepared ${n.toLowerCase()}.`,
    venueId: DEMO_VENUE_ID,
  }));

  const events: VenueEvent[] = [
    {
      id: "evt-1",
      title: "Champions League Final Watch Party",
      description: "Big screen, premium seating and a special match-day menu.",
      date: daysFromNow(5),
      ticketPrice: 25,
      capacity: 180,
      attendance: 96,
      status: "Published",
      venueId: DEMO_VENUE_ID,
    },
    {
      id: "evt-2",
      title: "NFL Sunday Night Showdown",
      description: "Wings & beer buckets all night.",
      date: daysFromNow(2),
      ticketPrice: 15,
      capacity: 120,
      attendance: 64,
      status: "Published",
      venueId: DEMO_VENUE_ID,
    },
    {
      id: "evt-3",
      title: "Boxing Heavyweight Title Night",
      description: "Pay-per-view on every screen.",
      date: daysFromNow(12),
      ticketPrice: 30,
      capacity: 150,
      attendance: 0,
      status: "Draft",
      venueId: DEMO_VENUE_ID,
    },
    {
      id: "evt-4",
      title: "Six Nations Rugby Brunch",
      description: "Bottomless brunch with the rugby.",
      date: daysFromNow(-3),
      ticketPrice: 20,
      capacity: 100,
      attendance: 88,
      status: "Published",
      venueId: DEMO_VENUE_ID,
    },
  ];

  const games: Game[] = [
    { id: "game-1", title: "Arsenal vs Chelsea", league: "Premier League", schedule: daysFromNow(1, 17), enabled: true, venueId: DEMO_VENUE_ID },
    { id: "game-2", title: "Lakers vs Celtics", league: "NBA", schedule: daysFromNow(3, 20), enabled: true, venueId: DEMO_VENUE_ID },
    { id: "game-3", title: "Chiefs vs Bills", league: "NFL", schedule: daysFromNow(6, 21), enabled: false, venueId: DEMO_VENUE_ID },
    { id: "game-4", title: "Real Madrid vs Barcelona", league: "La Liga", schedule: daysFromNow(8, 19), enabled: true, venueId: DEMO_VENUE_ID },
    { id: "game-5", title: "Yankees vs Red Sox", league: "MLB", schedule: daysFromNow(4, 18), enabled: true, venueId: DEMO_VENUE_ID },
  ];

  const users: PlatformUser[] = Array.from({ length: 38 }).map((_, i) => ({
    id: `usr-${i + 1}`,
    name: name(i),
    email: `${pick(firstNames, i).toLowerCase()}.${pick(lastNames, i * 3 + 1).toLowerCase()}@email.com`,
    status: i % 11 === 0 ? "Blocked" : "Active",
    joinedAt: daysFromNow(-(i * 9 + 3), 10),
    totalBookings: (i * 3) % 9,
    role: "user",
    totalOrders: (i * 5) % 22,
    venueId: i % 3 === 0 ? "venue-2" : DEMO_VENUE_ID,
  }));

  const platformUsers: PlatformUser[] = [
    {
      id: "admin-1",
      name: "Platform Admin",
      email: "admin@sportsbar.com",
      role: "admin",
      status: "Active",
      joinedAt: new Date().toISOString(),
      totalBookings: 0,
      totalOrders: 0,
      venueId: null,
    },
    {
      id: "super-1",
      name: "Super Admin",
      email: "super@sportsbar.com",
      role: "super_admin",
      status: "Active",
      joinedAt: new Date().toISOString(),
      totalBookings: 0,
      totalOrders: 0,
      venueId: null,
    },
  ];

  const orders: Order[] = Array.from({ length: 46 }).map((_, i) => {
    const itemCount = 1 + (i % 3);
    const items: Order["items"] = Array.from({ length: itemCount }).map((__, j) => {
      const [n, , price] = pick(menuCatalog, i + j * 4);
      return { name: n, quantity: 1 + ((i + j) % 3), price };
    });
    const total = items.reduce((s, it) => s + it.price * it.quantity, 0);
    return {
      id: `ORD-${1042 + i}`,
      customerName: name(i + 2),
      table: `T${1 + (i % 18)}`,
      items,
      total,
      status: pick(orderStatuses, i % 6 === 5 && i % 7 === 0 ? 5 : i % 6),
      createdAt: minutesAgo(i * 17 + 4),
      venueId: i % 4 === 0 ? "venue-2" : DEMO_VENUE_ID,
    };
  });

  const bookings: Booking[] = [
    {
      id: "BK123456", userId: "usr-3", customerName: name(3), eventId: "evt-1",
      eventTitle: events[0].title, tableNumber: "T12", status: "Confirmed",
      paymentStatus: "Paid", checkedInAt: null, checkedInBy: null,
      expiresAt: daysFromNow(5, 23), venueId: DEMO_VENUE_ID,
    },
    {
      id: "BK123457", userId: "usr-5", customerName: name(5), eventId: "evt-2",
      eventTitle: events[1].title, tableNumber: "T4", status: "Confirmed",
      paymentStatus: "Paid", checkedInAt: null, checkedInBy: null,
      expiresAt: daysFromNow(2, 23), venueId: DEMO_VENUE_ID,
    },
    {
      id: "BK123458", userId: "usr-8", customerName: name(8), eventId: "evt-1",
      eventTitle: events[0].title, tableNumber: "T7", status: "CheckedIn",
      paymentStatus: "Paid", checkedInAt: minutesAgo(40), checkedInBy: "Demo Admin",
      expiresAt: daysFromNow(5, 23), venueId: DEMO_VENUE_ID,
    },
    {
      id: "BK123459", userId: "usr-11", customerName: name(11), eventId: "evt-2",
      eventTitle: events[1].title, tableNumber: "T15", status: "PaymentPending",
      paymentStatus: "Pending", checkedInAt: null, checkedInBy: null,
      expiresAt: daysFromNow(2, 23), venueId: DEMO_VENUE_ID,
    },
    {
      id: "BK123460", userId: "usr-2", customerName: name(2), eventId: "evt-4",
      eventTitle: events[3].title, tableNumber: "T9", status: "Confirmed",
      paymentStatus: "Paid", checkedInAt: null, checkedInBy: null,
      expiresAt: daysFromNow(-3, 23), venueId: DEMO_VENUE_ID,
    },
    {
      id: "BK123461", userId: "usr-14", customerName: name(14), eventId: "evt-3",
      eventTitle: events[2].title, tableNumber: "T2", status: "Cancelled",
      paymentStatus: "Paid", checkedInAt: null, checkedInBy: null,
      expiresAt: daysFromNow(12, 23), venueId: DEMO_VENUE_ID,
    },
  ];

  const notifications: AppNotification[] = [
    { id: "ntf-1", type: "Announcement", title: "Happy Hour Extended", message: "Happy hour now runs until 8pm every Friday.", audience: "All customers", sentAt: minutesAgo(180), venueId: DEMO_VENUE_ID },
    { id: "ntf-2", type: "Match Reminder", title: "Kick-off in 1 hour", message: "Arsenal vs Chelsea starts soon. Grab your seat!", audience: "Event attendees", sentAt: minutesAgo(640), venueId: DEMO_VENUE_ID },
    { id: "ntf-3", type: "Order Ready", title: "Order ORD-1044 ready", message: "Your order is ready for collection at the bar.", audience: "Single customer", sentAt: minutesAgo(900), venueId: DEMO_VENUE_ID },
  ];

  const venues: Venue[] = [
    { id: "venue-1", name: "The Endzone Sports Bar", city: "Chicago", owner: "Demo Admin", status: "Active", revenue: 184200, createdAt: daysFromNow(-420, 10) },
    { id: "venue-2", name: "Overtime Tavern", city: "Austin", owner: "Maria Lopez", status: "Active", revenue: 142800, createdAt: daysFromNow(-360, 10) },
    { id: "venue-3", name: "The Penalty Box", city: "Boston", owner: "Sean Murphy", status: "Active", revenue: 98300, createdAt: daysFromNow(-240, 10) },
    { id: "venue-4", name: "Grand Slam Grill", city: "Denver", owner: "Priya Patel", status: "Suspended", revenue: 51200, createdAt: daysFromNow(-150, 10) },
    { id: "venue-5", name: "Fast Break Lounge", city: "Seattle", owner: "Tom Becker", status: "Active", revenue: 76900, createdAt: daysFromNow(-90, 10) },
  ];

  const offers: Offer[] = [
    {
      id: "off-1",
      name: "Welcome Flat 10 Off",
      code: "WELCOME10",
      description: "Flat discount for first-time diners.",
      type: "Flat Discount",
      discountValue: 10,
      activationType: "Immediate",
      startDate: daysFromNow(-20, 0),
      endDate: daysFromNow(40, 23),
      expiryDurationMinutes: 1440,
      maxAssignments: 500,
      perCustomerLimit: 1,
      maxRedemptions: 500,
      enabled: true,
      assignedCount: 214,
      redeemedCount: 158,
      createdAt: daysFromNow(-20, 9),
      venueId: DEMO_VENUE_ID,
    },
    {
      id: "off-2",
      name: "Match Day 20% Off",
      description: "Percentage discount during live match hours.",
      type: "Percentage Discount",
      discountValue: 20,
      activationType: "OnQrScan",
      startDate: daysFromNow(-10, 0),
      endDate: daysFromNow(30, 23),
      expiryDurationMinutes: 180,
      maxAssignments: 300,
      perCustomerLimit: 2,
      maxRedemptions: 300,
      enabled: true,
      assignedCount: 132,
      redeemedCount: 91,
      createdAt: daysFromNow(-10, 9),
      venueId: DEMO_VENUE_ID,
    },
    {
      id: "off-3",
      name: "Free Loaded Nachos",
      description: "Complimentary starter with any main course.",
      type: "Free Item",
      freeItemName: "Loaded Nachos",
      activationType: "Manual",
      startDate: daysFromNow(-5, 0),
      endDate: daysFromNow(25, 23),
      expiryDurationMinutes: 60,
      maxAssignments: 150,
      perCustomerLimit: 1,
      maxRedemptions: 150,
      enabled: true,
      assignedCount: 58,
      redeemedCount: 40,
      createdAt: daysFromNow(-5, 9),
      venueId: DEMO_VENUE_ID,
    },
    {
      id: "off-4",
      name: "Weekend Combo Deal",
      description: "Discounted combo for weekend groups.",
      type: "Combo",
      benefitDetails: "2 Burgers + 2 Draft Lagers + Loaded Nachos at a fixed price.",
      activationType: "Immediate",
      startDate: daysFromNow(-15, 0),
      endDate: daysFromNow(-1, 23),
      expiryDurationMinutes: 720,
      maxAssignments: 200,
      perCustomerLimit: 1,
      maxRedemptions: 200,
      enabled: true,
      assignedCount: 176,
      redeemedCount: 140,
      createdAt: daysFromNow(-15, 9),
      venueId: DEMO_VENUE_ID,
    },
    {
      id: "off-5",
      name: "BOGO Cocktails",
      description: "Buy one cocktail, get one free.",
      type: "Buy One Get One",
      benefitDetails: "Applies to house cocktails only.",
      activationType: "OnQrScan",
      startDate: daysFromNow(-2, 0),
      endDate: daysFromNow(15, 23),
      expiryDurationMinutes: 120,
      maxAssignments: 250,
      perCustomerLimit: 2,
      maxRedemptions: 250,
      enabled: false,
      assignedCount: 34,
      redeemedCount: 12,
      createdAt: daysFromNow(-2, 9),
      venueId: DEMO_VENUE_ID,
    },
    {
      id: "off-6",
      name: "Loyalty Cashback",
      description: "Cashback credited to wallet on orders above $40.",
      type: "Cashback",
      discountValue: 5,
      activationType: "Manual",
      startDate: daysFromNow(-30, 0),
      endDate: daysFromNow(60, 23),
      expiryDurationMinutes: 4320,
      maxAssignments: null,
      perCustomerLimit: 1,
      maxRedemptions: null,
      enabled: true,
      assignedCount: 302,
      redeemedCount: 245,
      createdAt: daysFromNow(-30, 9),
      venueId: DEMO_VENUE_ID,
    },
    {
      id: "off-7",
      name: "Birthday Dessert on Us",
      description: "Free dessert for birthday bookings.",
      type: "Dessert",
      benefitDetails: "One complimentary Chocolate Brownie per birthday booking.",
      activationType: "Immediate",
      startDate: daysFromNow(-45, 0),
      endDate: daysFromNow(-10, 23),
      expiryDurationMinutes: 1440,
      maxAssignments: 80,
      perCustomerLimit: 1,
      maxRedemptions: 80,
      enabled: true,
      assignedCount: 67,
      redeemedCount: 61,
      createdAt: daysFromNow(-45, 9),
      venueId: DEMO_VENUE_ID,
    },
  ];

  const assignedOffers: AssignedOffer[] = users.flatMap((u, i) =>
    buildAssignedOffersForUser(u.id, i, offers),
  );

  const quizModule = seedQuizModule(DEMO_VENUE_ID);

  return {
    orders, menu, events, games, users, bookings, notifications,
    scanLogs: [], platformUsers, venues, offers, assignedOffers,
    ...quizModule,
  };
}

// Mock Database
let _db: MockDb | null = null;

export function db(): MockDb {
  if (!_db) _db = seed();
  return _db;
}

export function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

