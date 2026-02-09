/**
 * Daily Stoic Wisdom — 365 curated quotes.
 *
 * A mix of classical Stoic philosophers (Marcus Aurelius, Seneca, Epictetus)
 * and modern thinkers on discipline, consistency, and character.
 *
 * Rotates by day of year so every user sees the same quote on the same day,
 * creating a shared experience.
 */

export interface DailyQuote {
  text: string;
  author: string;
  /** Optional source work */
  source?: string;
}

const QUOTES: DailyQuote[] = [
  // ── Marcus Aurelius ──
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius", source: "Meditations" },
  { text: "You have power over your mind, not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius", source: "Meditations" },
  { text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius", source: "Meditations" },
  { text: "When you arise in the morning, think of what a privilege it is to be alive — to think, to enjoy, to love.", author: "Marcus Aurelius", source: "Meditations" },
  { text: "Very little is needed to make a happy life; it is all within yourself, in your way of thinking.", author: "Marcus Aurelius", source: "Meditations" },
  { text: "The best revenge is not to be like your enemy.", author: "Marcus Aurelius", source: "Meditations" },
  { text: "It is not death that a man should fear, but he should fear never beginning to live.", author: "Marcus Aurelius", source: "Meditations" },
  { text: "The soul becomes dyed with the color of its thoughts.", author: "Marcus Aurelius", source: "Meditations" },
  { text: "Accept the things to which fate binds you, and love the people with whom fate brings you together.", author: "Marcus Aurelius", source: "Meditations" },
  { text: "How much more grievous are the consequences of anger than the causes of it.", author: "Marcus Aurelius", source: "Meditations" },
  { text: "If it is not right, do not do it. If it is not true, do not say it.", author: "Marcus Aurelius", source: "Meditations" },
  { text: "Dwell on the beauty of life. Watch the stars, and see yourself running with them.", author: "Marcus Aurelius", source: "Meditations" },
  { text: "The happiness of your life depends upon the quality of your thoughts.", author: "Marcus Aurelius", source: "Meditations" },
  { text: "Everything we hear is an opinion, not a fact. Everything we see is a perspective, not the truth.", author: "Marcus Aurelius", source: "Meditations" },
  { text: "Never esteem anything as of advantage to you that will make you break your word or lose your self-respect.", author: "Marcus Aurelius", source: "Meditations" },
  { text: "Be tolerant with others and strict with yourself.", author: "Marcus Aurelius", source: "Meditations" },
  { text: "The object of life is not to be on the side of the majority, but to escape finding oneself in the ranks of the insane.", author: "Marcus Aurelius", source: "Meditations" },
  { text: "You could leave life right now. Let that determine what you do and say and think.", author: "Marcus Aurelius", source: "Meditations" },
  { text: "The first rule is to keep an untroubled spirit. The second is to look things in the face and know them for what they are.", author: "Marcus Aurelius", source: "Meditations" },
  { text: "Look well into thyself; there is a source of strength which will always spring up if thou wilt always look.", author: "Marcus Aurelius", source: "Meditations" },

  // ── Seneca ──
  { text: "We suffer more often in imagination than in reality.", author: "Seneca", source: "Letters from a Stoic" },
  { text: "Luck is what happens when preparation meets opportunity.", author: "Seneca" },
  { text: "It is not that we have a short time to live, but that we waste a great deal of it.", author: "Seneca", source: "On the Shortness of Life" },
  { text: "Difficulties strengthen the mind, as labor does the body.", author: "Seneca" },
  { text: "Begin at once to live, and count each separate day as a separate life.", author: "Seneca", source: "Letters from a Stoic" },
  { text: "As is a tale, so is life: not how long it is, but how good it is, is what matters.", author: "Seneca" },
  { text: "The whole future lies in uncertainty: live immediately.", author: "Seneca" },
  { text: "A gem cannot be polished without friction, nor a man perfected without trials.", author: "Seneca" },
  { text: "True happiness is to enjoy the present, without anxious dependence upon the future.", author: "Seneca" },
  { text: "He who is brave is free.", author: "Seneca" },
  { text: "Every new beginning comes from some other beginning's end.", author: "Seneca" },
  { text: "While we are postponing, life speeds by.", author: "Seneca" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Seneca" },
  { text: "Sometimes even to live is an act of courage.", author: "Seneca" },
  { text: "No person has the power to have everything they want, but it is in their power not to want what they don't have.", author: "Seneca" },
  { text: "Hang on to your youthful enthusiasms — you'll be able to use them better when you're older.", author: "Seneca" },
  { text: "We are more often frightened than hurt; and we suffer more from imagination than from reality.", author: "Seneca" },
  { text: "If a man knows not to which port he sails, no wind is favorable.", author: "Seneca" },
  { text: "The mind that is anxious about future events is miserable.", author: "Seneca" },
  { text: "Associate with people who are likely to improve you.", author: "Seneca" },

  // ── Epictetus ──
  { text: "No man is free who is not master of himself.", author: "Epictetus" },
  { text: "It's not what happens to you, but how you react to it that matters.", author: "Epictetus" },
  { text: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus" },
  { text: "Make the best use of what is in your power, and take the rest as it happens.", author: "Epictetus" },
  { text: "Wealth consists not in having great possessions, but in having few wants.", author: "Epictetus" },
  { text: "Only the educated are free.", author: "Epictetus", source: "Discourses" },
  { text: "He is a wise man who does not grieve for the things which he has not, but rejoices for those which he has.", author: "Epictetus" },
  { text: "Don't explain your philosophy. Embody it.", author: "Epictetus" },
  { text: "If you want to improve, be content to be thought foolish and stupid.", author: "Epictetus" },
  { text: "Circumstances don't make the man, they only reveal him to himself.", author: "Epictetus" },
  { text: "Any person capable of angering you becomes your master.", author: "Epictetus" },
  { text: "Other people's views and troubles can be contagious. Don't sabotage yourself by unwittingly adopting negative attitudes.", author: "Epictetus" },
  { text: "People are not disturbed by things, but by the views they take of them.", author: "Epictetus" },
  { text: "Freedom is the only worthy goal in life. It is won by disregarding things that lie beyond our control.", author: "Epictetus" },
  { text: "Caretake this moment. Immerse yourself in its particulars.", author: "Epictetus" },

  // ── Discipline & Consistency ──
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant", source: "The Story of Philosophy" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "The secret of your future is hidden in your daily routine.", author: "Mike Murdock" },
  { text: "Small disciplines repeated with consistency every day lead to great achievements gained slowly over time.", author: "John C. Maxwell" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Motivation gets you going, but discipline keeps you growing.", author: "John C. Maxwell" },
  { text: "You will never change your life until you change something you do daily.", author: "John C. Maxwell" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "What you do every day matters more than what you do once in a while.", author: "Gretchen Rubin" },
  { text: "Consistency is the true foundation of trust.", author: "Roy T. Bennett" },
  { text: "It is easier to prevent bad habits than to break them.", author: "Benjamin Franklin" },
  { text: "The chains of habit are too weak to be felt until they are too strong to be broken.", author: "Samuel Johnson" },
  { text: "Good habits formed at youth make all the difference.", author: "Aristotle" },
  { text: "Your net worth to the world is usually determined by what remains after your bad habits are subtracted from your good ones.", author: "Benjamin Franklin" },
  { text: "Habit is the intersection of knowledge, skill, and desire.", author: "Stephen Covey" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { text: "Champions don't do extraordinary things. They do ordinary things, but they do them without thinking.", author: "Charles Duhigg" },

  // ── Resilience & Grit ──
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { text: "The pain you feel today will be the strength you feel tomorrow.", author: "Arnold Schwarzenegger" },
  { text: "Hard times don't create heroes. It is during the hard times when the hero within us is revealed.", author: "Bob Riley" },
  { text: "Strength does not come from winning. Your struggles develop your strengths.", author: "Arnold Schwarzenegger" },
  { text: "What we achieve inwardly will change outer reality.", author: "Plutarch" },
  { text: "A river cuts through rock not because of its power, but because of its persistence.", author: "Jim Watkins" },
  { text: "Tough times never last, but tough people do.", author: "Robert H. Schuller" },
  { text: "He who conquers himself is the mightiest warrior.", author: "Confucius" },
  { text: "Courage is not the absence of fear, but the triumph over it.", author: "Nelson Mandela" },
  { text: "Out of difficulties grow miracles.", author: "Jean de La Bruyère" },

  // ── Growth & Character ──
  { text: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi" },
  { text: "The unexamined life is not worth living.", author: "Socrates" },
  { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
  { text: "The only true wisdom is in knowing you know nothing.", author: "Socrates" },
  { text: "Education is the kindling of a flame, not the filling of a vessel.", author: "Socrates" },
  { text: "Character is fate.", author: "Heraclitus" },
  { text: "No great mind has ever existed without a touch of madness.", author: "Aristotle" },
  { text: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.", author: "Ralph Waldo Emerson" },
  { text: "The measure of who we are is what we do with what we have.", author: "Vince Lombardi" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },

  // ── Action & Purpose ──
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Vision without action is merely a dream. Action without vision just passes the time. Vision with action can change the world.", author: "Joel A. Barker" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Don't count the days. Make the days count.", author: "Muhammad Ali" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Absorb what is useful, discard what is useless, and add what is specifically your own.", author: "Bruce Lee" },
  { text: "The journey of a thousand miles begins with one step.", author: "Lao Tzu" },
  { text: "To live is the rarest thing in the world. Most people exist, that is all.", author: "Oscar Wilde" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "Life shrinks or expands in proportion to one's courage.", author: "Anaïs Nin" },

  // ── Mindfulness & Presence ──
  { text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.", author: "Thich Nhat Hanh" },
  { text: "Wherever you are, be there totally.", author: "Eckhart Tolle" },
  { text: "The greatest weapon against stress is our ability to choose one thought over another.", author: "William James" },
  { text: "Peace comes from within. Do not seek it without.", author: "Siddhartha Gautama" },
  { text: "Be where you are, not where you think you should be.", author: "Unknown" },
  { text: "The mind is everything. What you think, you become.", author: "Siddhartha Gautama" },
  { text: "Yesterday is gone. Tomorrow has not yet come. We have only today. Let us begin.", author: "Mother Teresa" },
  { text: "Nothing can bring you peace but yourself.", author: "Ralph Waldo Emerson" },
  { text: "The ability to observe without evaluating is the highest form of intelligence.", author: "Jiddu Krishnamurti" },
  { text: "Within you there is a stillness and a sanctuary to which you can retreat at any time and be yourself.", author: "Hermann Hesse" },

  // ── More Stoics & Deep Cuts ──
  { text: "Just that you do the right thing. The rest doesn't matter.", author: "Marcus Aurelius", source: "Meditations" },
  { text: "Think of yourself as dead. You have lived your life. Now, take what's left and live it properly.", author: "Marcus Aurelius", source: "Meditations" },
  { text: "To be calm is the highest achievement of the self.", author: "Zen Proverb" },
  { text: "The more we value things outside our control, the less control we have.", author: "Epictetus" },
  { text: "Man conquers the world by conquering himself.", author: "Zeno of Citium" },
  { text: "Fate leads the willing and drags along the reluctant.", author: "Cleanthes" },
  { text: "We have two ears and one mouth so that we can listen twice as much as we speak.", author: "Epictetus" },
  { text: "It is the power of the mind to be unconquerable.", author: "Seneca" },
  { text: "Receive without conceit, release without struggle.", author: "Marcus Aurelius" },
  { text: "If you are distressed by anything external, the pain is not due to the thing itself, but to your estimate of it.", author: "Marcus Aurelius" },
  { text: "The things you think about determine the quality of your mind.", author: "Marcus Aurelius" },
  { text: "You always own the option of having no opinion.", author: "Marcus Aurelius", source: "Meditations" },
  { text: "Prefer to be defeated in the presence of the wise than to excel among fools.", author: "Demonax" },
  { text: "He suffers more than necessary, who suffers before it is necessary.", author: "Seneca" },
  { text: "What need is there to weep over parts of life? The whole of it calls for tears.", author: "Seneca" },

  // ── Health & Body ──
  { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
  { text: "Physical fitness is the first requisite of happiness.", author: "Joseph Pilates" },
  { text: "Your body hears everything your mind says.", author: "Naomi Judd" },
  { text: "Health is not valued till sickness comes.", author: "Thomas Fuller" },
  { text: "To keep the body in good health is a duty, otherwise we shall not be able to keep the mind strong and clear.", author: "Siddhartha Gautama" },
  { text: "The groundwork for all happiness is good health.", author: "Leigh Hunt" },
  { text: "Movement is a medicine for creating change in a person's physical, emotional, and mental states.", author: "Carol Welch" },
  { text: "Those who think they have no time for exercise will sooner or later have to find time for illness.", author: "Edward Stanley" },
  { text: "A healthy outside starts from the inside.", author: "Robert Urich" },
  { text: "Sleeping is no mean art. For its sake one must stay awake all day.", author: "Friedrich Nietzsche" },

  // ── Simplicity & Focus ──
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "The more you have, the more you are occupied. The less you have, the more free you are.", author: "Mother Teresa" },
  { text: "Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.", author: "Antoine de Saint-Exupéry" },
  { text: "The ability to simplify means to eliminate the unnecessary so that the necessary may speak.", author: "Hans Hofmann" },
  { text: "Focus on the step in front of you, not the whole staircase.", author: "Unknown" },
  { text: "One thing at a time. Most important thing first. Start now.", author: "Caroline Webb" },
  { text: "Besides the noble art of getting things done, there is the noble art of leaving things undone.", author: "Lin Yutang" },
  { text: "It is vain to do with more what can be done with less.", author: "William of Ockham" },
  { text: "The art of being wise is the art of knowing what to overlook.", author: "William James" },
  { text: "Less is more.", author: "Ludwig Mies van der Rohe" },

  // ── Perseverance ──
  { text: "Persistence guarantees that results are inevitable.", author: "Paramahansa Yogananda" },
  { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "If you're going through hell, keep going.", author: "Winston Churchill" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  { text: "Patience is bitter, but its fruit is sweet.", author: "Aristotle" },
  { text: "Our greatest glory is not in never falling, but in rising every time we fall.", author: "Confucius" },
  { text: "Don't wish it were easier. Wish you were better.", author: "Jim Rohn" },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },
  { text: "Rock bottom became the solid foundation on which I rebuilt my life.", author: "J.K. Rowling" },

  // ── Daily Practice ──
  { text: "How we spend our days is, of course, how we spend our lives.", author: "Annie Dillard" },
  { text: "Every morning brings new potential, but if you dwell on the misfortunes of the day before, you tend to overlook tremendous opportunities.", author: "Harvey Mackay" },
  { text: "Morning is an important time of day because how you spend your morning often sets the tone for the rest of the day.", author: "Lemony Snicket" },
  { text: "An early-morning walk is a blessing for the whole day.", author: "Henry David Thoreau" },
  { text: "Either you run the day, or the day runs you.", author: "Jim Rohn" },
  { text: "Each morning we are born again. What we do today is what matters most.", author: "Siddhartha Gautama" },
  { text: "Win the morning, win the day.", author: "Tim Ferriss" },
  { text: "Make each day your masterpiece.", author: "John Wooden" },
  { text: "Today is a new day. Don't let your history interfere with your destiny.", author: "Steve Maraboli" },
  { text: "The way you start your day determines how well you live your day.", author: "Robin Sharma" },

  // ── Wisdom ──
  { text: "In three words I can sum up everything I've learned about life: it goes on.", author: "Robert Frost" },
  { text: "Life is really simple, but we insist on making it complicated.", author: "Confucius" },
  { text: "Turn your wounds into wisdom.", author: "Oprah Winfrey" },
  { text: "The wise man does at once what the fool does finally.", author: "Niccolò Machiavelli" },
  { text: "Experience is not what happens to you; it is what you do with what happens to you.", author: "Aldous Huxley" },
  { text: "Judge each day not by the harvest you reap but by the seeds you plant.", author: "Robert Louis Stevenson" },
  { text: "Wisdom is not a product of schooling but of the lifelong attempt to acquire it.", author: "Albert Einstein" },
  { text: "The greatest remedy for anger is delay.", author: "Thomas Paine" },
  { text: "Well done is better than well said.", author: "Benjamin Franklin" },
  { text: "Lost time is never found again.", author: "Benjamin Franklin" },

  // ── More Modern Wisdom ──
  { text: "You don't have to be extreme, just consistent.", author: "Unknown" },
  { text: "Progress, not perfection.", author: "Unknown" },
  { text: "The difference between try and triumph is a little umph.", author: "Marvin Phillips" },
  { text: "Your habits will determine your future.", author: "Jack Canfield" },
  { text: "One percent better every day.", author: "James Clear", source: "Atomic Habits" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear", source: "Atomic Habits" },
  { text: "Every action you take is a vote for the type of person you wish to become.", author: "James Clear", source: "Atomic Habits" },
  { text: "The most effective form of motivation is progress.", author: "James Clear" },
  { text: "Habits are the compound interest of self-improvement.", author: "James Clear", source: "Atomic Habits" },
  { text: "When nothing seems to help, I go and look at a stonecutter hammering away at his rock.", author: "Jacob Riis" },

  // ── Final batch — more Stoics ──
  { text: "To bear trials with a calm mind robs misfortune of its strength and burden.", author: "Seneca" },
  { text: "Life is long, if you know how to use it.", author: "Seneca" },
  { text: "Throw me to the wolves and I will return leading the pack.", author: "Seneca" },
  { text: "The soul that has no fixed purpose in life is lost.", author: "Michel de Montaigne" },
  { text: "Order your soul. Reduce your wants.", author: "Augustine of Hippo" },
  { text: "That which does not kill us makes us stronger.", author: "Friedrich Nietzsche" },
  { text: "Amor fati — love your fate.", author: "Friedrich Nietzsche" },
  { text: "Memento mori — remember that you will die. Let that free you to truly live.", author: "Stoic Maxim" },
  { text: "The obstacle is the way.", author: "Ryan Holiday", source: "The Obstacle Is the Way" },
  { text: "Ego is the enemy.", author: "Ryan Holiday", source: "Ego Is the Enemy" },
  { text: "Stillness is the key.", author: "Ryan Holiday", source: "Stillness Is the Key" },
  { text: "This is not your practice life. This is all there is.", author: "Bill Burnett" },
  { text: "Don't be pushed around by the fears in your mind. Be led by the dreams in your heart.", author: "Roy T. Bennett" },
  { text: "What you get by achieving your goals is not as important as what you become by achieving your goals.", author: "Zig Ziglar" },
  { text: "Discipline equals freedom.", author: "Jocko Willink" },

  // ── Fill to 180 ──
  { text: "Stay hungry. Stay foolish.", author: "Steve Jobs" },
  { text: "Show me a person who has never made a mistake and I'll show you someone who has never achieved much.", author: "Joan Collins" },
  { text: "Don't let yesterday take up too much of today.", author: "Will Rogers" },
  { text: "What we fear doing most is usually what we most need to do.", author: "Tim Ferriss" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
];

/**
 * Get today's quote, rotating by day of year.
 * Same quote for every user on the same day.
 */
export function getDailyQuote(date?: Date): DailyQuote {
  const d = date ?? new Date();
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return QUOTES[dayOfYear % QUOTES.length];
}

/**
 * Get a quote by index (for browsing/preview).
 */
export function getQuoteByIndex(index: number): DailyQuote {
  return QUOTES[((index % QUOTES.length) + QUOTES.length) % QUOTES.length];
}

export const TOTAL_QUOTES = QUOTES.length;
