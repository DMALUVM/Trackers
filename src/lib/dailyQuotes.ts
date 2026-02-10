/**
 * Daily Wisdom — 365 curated quotes.
 *
 * A mix of Stoic philosophers (Marcus Aurelius, Seneca, Epictetus),
 * scientists (Einstein, Curie), leaders (Mandela, Churchill, Roosevelt),
 * and modern thinkers on discipline, habits, and character.
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
  { text: "What we do on some great occasion will probably depend on what we already are.", author: "H.P. Liddon" },
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
  { text: "Without hustle, talent will only carry you so far.", author: "Gary Vaynerchuk" },
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
  { text: "It is the power of the mind to be unconquerable.", author: "Seneca" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Motivation gets you going, but discipline keeps you growing.", author: "John C. Maxwell" },
  { text: "You will never change your life until you change something you do daily.", author: "John C. Maxwell" },
  { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
  { text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "Perseverance is not a long race; it is many short races one after the other.", author: "Walter Elliot" },
  { text: "What we think, we become.", author: "Buddha" },
  { text: "It is easier to prevent bad habits than to break them.", author: "Benjamin Franklin" },
  { text: "Man is not worried by real problems so much as by his imagined anxieties about real problems.", author: "Epictetus" },
  { text: "Good habits formed at youth make all the difference.", author: "Aristotle" },
  { text: "Your net worth to the world is usually determined by what remains after your bad habits are subtracted from your good ones.", author: "Benjamin Franklin" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { text: "Well-being is realized by small steps, but is truly no small thing.", author: "Zeno of Citium" },

  // ── Resilience & Grit ──
  { text: "Adventure is worthwhile in itself.", author: "Amelia Earhart" },
  { text: "The key is not to prioritize what is on your schedule, but to schedule your priorities.", author: "Stephen Covey" },
  { text: "Man conquers the world by conquering himself.", author: "Zeno of Citium" },
  { text: "Strength does not come from winning. Your struggles develop your strengths.", author: "Arnold Schwarzenegger" },
  { text: "Your habits are a vote for the type of person you wish to become.", author: "James Clear" },
  { text: "A river cuts through rock not because of its power, but because of its persistence.", author: "Jim Watkins" },
  { text: "Tough times never last, but tough people do.", author: "Robert H. Schuller" },
  { text: "He who conquers himself is the mightiest warrior.", author: "Confucius" },
  { text: "Out of difficulties grow miracles.", author: "Jean de La Bruyère" },

  // ── Growth & Character ──
  { text: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi" },
  { text: "The secret of change is to focus all of your energy not on fighting the old, but on building the new.", author: "Socrates" },
  { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
  { text: "The only true wisdom is in knowing you know nothing.", author: "Socrates" },
  { text: "Education is the kindling of a flame, not the filling of a vessel.", author: "Socrates" },
  { text: "Character is fate.", author: "Heraclitus" },
  { text: "No great mind has ever existed without a touch of madness.", author: "Aristotle" },
  { text: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.", author: "Ralph Waldo Emerson" },
  { text: "The measure of who we are is what we do with what we have.", author: "Vince Lombardi" },
  { text: "If you are distressed by anything external, the pain is not due to the thing itself, but to your estimate of it.", author: "Marcus Aurelius" },

  // ── Action & Purpose ──
  { text: "Vision without action is merely a dream. Action without vision just passes the time. Vision with action can change the world.", author: "Joel A. Barker" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Absorb what is useful, discard what is useless, and add what is specifically your own.", author: "Bruce Lee" },
  { text: "The journey of a thousand miles begins with one step.", author: "Lao Tzu" },
  { text: "To live is the rarest thing in the world. Most people exist, that is all.", author: "Oscar Wilde" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "The body benefits from movement, and the mind benefits from stillness.", author: "Sakyong Mipham" },

  // ── Mindfulness & Presence ──
  { text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.", author: "Thich Nhat Hanh" },
  { text: "The greatest mistake you can make in life is to be continually fearing you will make one.", author: "Elbert Hubbard" },
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
  { text: "Fate leads the willing and drags along the reluctant.", author: "Cleanthes" },
  { text: "We have two ears and one mouth so that we can listen twice as much as we speak.", author: "Epictetus" },
  { text: "Receive without conceit, release without struggle.", author: "Marcus Aurelius" },
  { text: "The things you think about determine the quality of your mind.", author: "Marcus Aurelius" },
  { text: "You always own the option of having no opinion.", author: "Marcus Aurelius", source: "Meditations" },
  { text: "Prefer to be defeated in the presence of the wise than to excel among fools.", author: "Demonax" },
  { text: "He suffers more than necessary, who suffers before it is necessary.", author: "Seneca" },
  { text: "What need is there to weep over parts of life? The whole of it calls for tears.", author: "Seneca" },

  // ── Health & Body ──
  { text: "Twenty years from now you will be more disappointed by the things you did not do than by the ones you did.", author: "Mark Twain" },
  { text: "Not how long, but how well you have lived is the main thing.", author: "Seneca" },
  { text: "Your body hears everything your mind says.", author: "Naomi Judd" },
  { text: "Health is not valued till sickness comes.", author: "Thomas Fuller" },
  { text: "To keep the body in good health is a duty, otherwise we shall not be able to keep the mind strong and clear.", author: "Siddhartha Gautama" },
  { text: "Sometimes the most productive thing you can do is rest.", author: "Mark Black" },
  { text: "Those who think they have no time for exercise will sooner or later have to find time for illness.", author: "Edward Stanley" },
  { text: "A healthy outside starts from the inside.", author: "Robert Urich" },
  { text: "Sleeping is no mean art. For its sake one must stay awake all day.", author: "Friedrich Nietzsche" },

  // ── Simplicity & Focus ──
  { text: "Every action you take is a vote for the type of person you wish to become.", author: "James Clear" },
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
  { text: "Showing up is 80 percent of life.", author: "Woody Allen" },
  { text: "Routine, in an intelligent man, is a sign of ambition.", author: "W.H. Auden" },
  { text: "If you're going through hell, keep going.", author: "Winston Churchill" },
  { text: "Patience is bitter, but its fruit is sweet.", author: "Aristotle" },
  { text: "Our greatest glory is not in never falling, but in rising every time we fall.", author: "Confucius" },
  { text: "Don't wish it were easier. Wish you were better.", author: "Jim Rohn" },
  { text: "Recovery is not a sign of weakness, it is a sign of intelligence.", author: "Unknown" },
  { text: "The only thing standing between you and your goal is the story you keep telling yourself.", author: "Jordan Belfort" },

  // ── Daily Practice ──
  { text: "How we spend our days is, of course, how we spend our lives.", author: "Annie Dillard" },
  { text: "In the depth of winter, I finally learned that within me there lay an invincible summer.", author: "Albert Camus" },
  { text: "Morning is an important time of day because how you spend your morning often sets the tone for the rest of the day.", author: "Lemony Snicket" },
  { text: "An early-morning walk is a blessing for the whole day.", author: "Henry David Thoreau" },
  { text: "Either you run the day, or the day runs you.", author: "Jim Rohn" },
  { text: "Each morning we are born again. What we do today is what matters most.", author: "Siddhartha Gautama" },
  { text: "Win the morning, win the day.", author: "Tim Ferriss" },
  { text: "The harder you work for something, the greater you will feel when you achieve it.", author: "Unknown" },
  { text: "Today is a new day. Don't let your history interfere with your destiny.", author: "Steve Maraboli" },
  { text: "The way you start your day determines how well you live your day.", author: "Robin Sharma" },

  // ── Wisdom ──
  { text: "Life is really simple, but we insist on making it complicated.", author: "Confucius" },
  { text: "Continuous improvement is better than delayed perfection.", author: "Mark Twain" },
  { text: "The wise man does at once what the fool does finally.", author: "Niccolò Machiavelli" },
  { text: "Experience is not what happens to you; it is what you do with what happens to you.", author: "Aldous Huxley" },
  { text: "Judge each day not by the harvest you reap but by the seeds you plant.", author: "Robert Louis Stevenson" },
  { text: "Wisdom is not a product of schooling but of the lifelong attempt to acquire it.", author: "Albert Einstein" },
  { text: "The greatest remedy for anger is delay.", author: "Thomas Paine" },
  { text: "Well done is better than well said.", author: "Benjamin Franklin" },
  { text: "Lost time is never found again.", author: "Benjamin Franklin" },

  // ── More Modern Wisdom ──
  { text: "You don't have to be extreme, just consistent.", author: "Unknown" },
  { text: "Impossible is just a big word thrown around by small men.", author: "Muhammad Ali" },
  { text: "The difference between try and triumph is a little umph.", author: "Marvin Phillips" },
  { text: "Your habits will determine your future.", author: "Jack Canfield" },
  { text: "One percent better every day.", author: "James Clear", source: "Atomic Habits" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear", source: "Atomic Habits" },
  { text: "The most effective form of motivation is progress.", author: "James Clear" },
  { text: "Only those who will risk going too far can possibly find out how far one can go.", author: "T.S. Eliot" },
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
  { text: "You have to fight through some bad days to earn the best days of your life.", author: "Unknown" },
  { text: "Ego is the enemy.", author: "Ryan Holiday", source: "Ego Is the Enemy" },
  { text: "Stillness is the key.", author: "Ryan Holiday", source: "Stillness Is the Key" },
  { text: "This is not your practice life. This is all there is.", author: "Bill Burnett" },
  { text: "Don't be pushed around by the fears in your mind. Be led by the dreams in your heart.", author: "Roy T. Bennett" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "The only thing we have to fear is fear itself.", author: "Franklin D. Roosevelt" },

  // ── Fill to 180 ──
  { text: "Stay hungry. Stay foolish.", author: "Steve Jobs" },
  { text: "Show me a person who has never made a mistake and I'll show you someone who has never achieved much.", author: "Joan Collins" },
  { text: "Don't let yesterday take up too much of today.", author: "Will Rogers" },
  { text: "What we fear doing most is usually what we most need to do.", author: "Tim Ferriss" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },

  // ── Scientists & Thinkers ──
  { text: "Insanity is doing the same thing over and over and expecting different results.", author: "Rita Mae Brown" },
  { text: "The measure of intelligence is the ability to change.", author: "Albert Einstein" },
  { text: "Nothing in life is to be feared, it is only to be understood.", author: "Marie Curie" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" },
  { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "What gets measured gets managed.", author: "Peter Drucker" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Your time is limited. Don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "A person who never made a mistake never tried anything new.", author: "Albert Einstein" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Be the change you wish to see in the world.", author: "Mahatma Gandhi" },
  { text: "If you want to lift yourself up, lift up someone else.", author: "Booker T. Washington" },
  { text: "The mind is everything. What you think you become.", author: "Buddha" },
  { text: "An unexamined life is not worth living.", author: "Socrates" },
  { text: "I think, therefore I am.", author: "René Descartes" },

  // ── Leaders & Achievers ──
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "In three words I can sum up everything I've learned about life: it goes on.", author: "Robert Frost" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "If you look at what you have in life, you'll always have more.", author: "Oprah Winfrey" },
  { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { text: "The purpose of our lives is to be happy.", author: "Dalai Lama" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
  { text: "I have learned over the years that when one's mind is made up, this diminishes fear.", author: "Rosa Parks" },
  { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The best preparation for tomorrow is doing your best today.", author: "H. Jackson Brown Jr." },
  { text: "Try not to become a man of success. Rather become a man of value.", author: "Albert Einstein" },
  { text: "Courage is not the absence of fear, but the triumph over it.", author: "Nelson Mandela" },
  { text: "Keep your face always toward the sunshine, and shadows will fall behind you.", author: "Walt Whitman" },
  { text: "Happiness is not something ready-made. It comes from your own actions.", author: "Dalai Lama" },
  { text: "Hard times don't create heroes. It is during the hard times when the hero within us is revealed.", author: "Bob Riley" },

  // ── Habit Science & Performance ──
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "Champions don't do extraordinary things. They do ordinary things, but they do them without thinking.", author: "Charles Duhigg" },
  { text: "The chains of habit are too weak to be felt until they are too strong to be broken.", author: "Samuel Johnson" },
  { text: "First forget inspiration. Habit is more dependable.", author: "Octavia Butler" },
  { text: "Small disciplines repeated with consistency every day lead to great achievements gained slowly over time.", author: "John C. Maxwell" },
  { text: "Depending on what they are, our habits will either make us or break us.", author: "Sean Covey" },
  { text: "Habit is the intersection of knowledge, skill, and desire.", author: "Stephen Covey" },
  { text: "The hard days are what make you stronger.", author: "Aly Raisman" },
  { text: "You are what you do, not what you say you'll do.", author: "Carl Jung" },
  { text: "Don't count the days. Make the days count.", author: "Muhammad Ali" },
  { text: "A year from now you may wish you had started today.", author: "Karen Lamb" },
  { text: "The pain you feel today will be the strength you feel tomorrow.", author: "Arnold Schwarzenegger" },
  { text: "What you do every day matters more than what you do once in a while.", author: "Gretchen Rubin" },
  { text: "Habits are the compound interest of self-improvement.", author: "James Clear", source: "Atomic Habits" },
  { text: "Goals are about the results you want to achieve. Systems are about the processes that lead to those results.", author: "James Clear", source: "Atomic Habits" },
  { text: "If you get one percent better each day for one year, you'll end up thirty-seven times better.", author: "James Clear", source: "Atomic Habits" },
  { text: "We do not rise to the level of our goals. We fall to the level of our systems.", author: "James Clear", source: "Atomic Habits" },
  { text: "The difference between who you are and who you want to be is what you do.", author: "Bill Phillips" },
  { text: "Excellence is an art won by training and habituation.", author: "Aristotle" },
  { text: "You'll never change your life until you change something you do daily.", author: "John C. Maxwell" },

  // ── Resilience & Growth ──
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { text: "He who has a why to live for can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "Rock bottom became the solid foundation on which I rebuilt my life.", author: "J.K. Rowling" },
  { text: "The world breaks everyone, and afterward, some are strong at the broken places.", author: "Ernest Hemingway" },
  { text: "Out of your vulnerabilities will come your strength.", author: "Sigmund Freud" },
  { text: "What does not kill me makes me stronger.", author: "Friedrich Nietzsche" },
  { text: "You gain strength, courage, and confidence by every experience in which you really stop to look fear in the face.", author: "Eleanor Roosevelt" },
  { text: "The greatest weapon against stress is our ability to choose one thought over another.", author: "William James" },
  { text: "Between stimulus and response there is a space. In that space is our power to choose our response.", author: "Viktor Frankl" },
  { text: "When everything seems to be going against you, remember that the airplane takes off against the wind.", author: "Henry Ford" },
  { text: "Our greatest glory is not in never failing, but in rising every time we fail.", author: "Confucius" },
  { text: "Turn your wounds into wisdom.", author: "Oprah Winfrey" },
  { text: "Difficulties strengthen the mind, as labor does the body.", author: "Seneca" },
  { text: "Life doesn't get easier. You just get stronger.", author: "Unknown" },

  // ── Mindfulness & Presence ──
  { text: "The present moment is the only moment available to us, and it is the door to all moments.", author: "Thich Nhat Hanh" },
  { text: "Wherever you are, be there totally.", author: "Eckhart Tolle" },
  { text: "The mind is its own place, and in itself can make a heaven of hell, a hell of heaven.", author: "John Milton" },
  { text: "Genius is one percent inspiration and ninety-nine percent perspiration.", author: "Thomas Edison" },
  { text: "Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.", author: "Thich Nhat Hanh" },
  { text: "The quieter you become, the more you can hear.", author: "Ram Dass" },
  { text: "Almost everything will work again if you unplug it for a few minutes, including you.", author: "Anne Lamott" },
  { text: "Breathe. Let go. And remind yourself that this very moment is the only one you know you have for sure.", author: "Oprah Winfrey" },
  { text: "Within you there is a stillness and a sanctuary to which you can retreat at any time.", author: "Hermann Hesse" },
  { text: "Your calm mind is the ultimate weapon against your challenges.", author: "Bryant McGill" },

  // ── Discipline & Consistency ──
  { text: "We must all suffer one of two things: the pain of discipline or the pain of regret.", author: "Jim Rohn" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "Self-discipline is the magic power that makes you virtually unstoppable.", author: "Dan Kennedy" },
  { text: "With self-discipline, most anything is possible.", author: "Theodore Roosevelt" },
  { text: "Freedom is nothing but a chance to be better.", author: "Albert Camus" },
  { text: "The more you sweat in training, the less you bleed in combat.", author: "Richard Marcinko" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "It's not about being the best. It's about being better than you were yesterday.", author: "Unknown" },
  { text: "Consistency is the true foundation of trust.", author: "Roy T. Bennett" },
  { text: "Long-term consistency trumps short-term intensity.", author: "Bruce Lee" },
  { text: "Be not afraid of going slowly, be afraid only of standing still.", author: "Chinese Proverb" },
  { text: "Dream big. Start small. Act now.", author: "Robin Sharma" },
  { text: "One day or day one. You decide.", author: "Paulo Coelho" },
  { text: "Discipline equals freedom.", author: "Jocko Willink" },
  { text: "Every morning brings new potential, but if you dwell on the misfortunes of the day before, you tend to overlook tremendous opportunities.", author: "Harvey Mackay" },

  // ── Health & Vitality ──
  { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
  { text: "Health is a state of complete physical, mental, and social well-being.", author: "World Health Organization" },
  { text: "To keep the body in good health is a duty. Otherwise we shall not be able to keep our mind strong and clear.", author: "Buddha" },
  { text: "Physical fitness is the first requisite of happiness.", author: "Joseph Pilates" },
  { text: "Movement is a medicine for creating change in a person's physical, emotional, and mental states.", author: "Carol Welch" },
  { text: "A good laugh and a long sleep are the two best cures for anything.", author: "Irish Proverb" },
  { text: "Sleep is the best meditation.", author: "Dalai Lama" },
  { text: "The groundwork for all happiness is good health.", author: "Leigh Hunt" },
  { text: "He who has health has hope; and he who has hope has everything.", author: "Thomas Carlyle" },
  { text: "Investing in early health is the best investment you can make.", author: "Andrew Huberman" },

  // ── Purpose & Character ──
  { text: "Character cannot be developed in ease and quiet. Only through trial and suffering can the soul be strengthened.", author: "Helen Keller" },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },
  { text: "Life shrinks or expands in proportion to one's courage.", author: "Anaïs Nin" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "The two most important days in your life are the day you are born and the day you find out why.", author: "Mark Twain" },
  { text: "Do not wait to strike till the iron is hot, but make it hot by striking.", author: "William Butler Yeats" },
  { text: "Life is not about finding yourself. Life is about creating yourself.", author: "George Bernard Shaw" },
  { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
  { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
  { text: "You must be the change you wish to see in the world.", author: "Mahatma Gandhi" },
  { text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "What we achieve inwardly will change outer reality.", author: "Plutarch" },
  { text: "We become what we think about most of the time.", author: "Earl Nightingale" },
  { text: "No one can make you feel inferior without your consent.", author: "Eleanor Roosevelt" },
  { text: "Knowing is not enough; we must apply. Willing is not enough; we must do.", author: "Johann Wolfgang von Goethe" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "The unexamined life is not worth living.", author: "Socrates" },
  { text: "Dwell on the beauty of life. Watch the stars, and see yourself running with them.", author: "Marcus Aurelius", source: "Meditations" },

  // ── Final stretch to 365 ──
  { text: "How you do anything is how you do everything.", author: "T. Harv Eker" },
  { text: "Be so good they can't ignore you.", author: "Steve Martin" },
  { text: "Doubt kills more dreams than failure ever will.", author: "Suzy Kassem" },
  { text: "The only way out is through.", author: "Robert Frost" },
  { text: "Done is better than perfect.", author: "Sheryl Sandberg" },
  { text: "Progress, not perfection.", author: "Unknown" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "If you want something you've never had, you must be willing to do something you've never done.", author: "Thomas Jefferson" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "It is never too late to be what you might have been.", author: "George Eliot" },
  { text: "Great things are done by a series of small things brought together.", author: "Vincent van Gogh" },
  { text: "Where there is no struggle, there is no strength.", author: "Oprah Winfrey" },
  { text: "The obstacle is the way.", author: "Ryan Holiday", source: "The Obstacle Is the Way" },
  { text: "Stop being afraid of what could go wrong, and start being excited about what could go right.", author: "Tony Robbins" },
  { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
  { text: "Strength does not come from physical capacity. It comes from an indomitable will.", author: "Mahatma Gandhi" },
  { text: "The body achieves what the mind believes.", author: "Napoleon Hill" },
  { text: "Make each day your masterpiece.", author: "John Wooden" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { text: "Yesterday is history, tomorrow is a mystery, today is a gift — that's why it's called the present.", author: "Alice Morse Earle" },
  { text: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown" },
  { text: "What you get by achieving your goals is not as important as what you become by achieving your goals.", author: "Zig Ziglar" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "Every day is a new beginning. Take a deep breath, smile, and start again.", author: "Unknown" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },

  // ── Final 16 to reach 365 ──
  { text: "The greatest discovery of all time is that a person can change their future by merely changing their attitude.", author: "Oprah Winfrey" },
  { text: "I am not a product of my circumstances. I am a product of my decisions.", author: "Stephen Covey" },
  { text: "Your life does not get better by chance, it gets better by change.", author: "Jim Rohn" },
  { text: "We are shaped by our thoughts; we become what we think.", author: "Buddha" },
  { text: "What you habitually think largely determines what you will ultimately become.", author: "Bruce Lee" },
  { text: "There is nothing noble in being superior to your fellow man; true nobility is being superior to your former self.", author: "Ernest Hemingway" },
  { text: "The world as we have created it is a process of our thinking. It cannot be changed without changing our thinking.", author: "Albert Einstein" },
  { text: "Stay committed to your decisions, but stay flexible in your approach.", author: "Tony Robbins" },
  { text: "All progress takes place outside the comfort zone.", author: "Michael John Bobak" },
  { text: "People often say that motivation does not last. Neither does bathing. That is why we recommend it daily.", author: "Zig Ziglar" },
  { text: "You are the average of the five people you spend the most time with.", author: "Jim Rohn" },
  { text: "Nothing will work unless you do.", author: "Maya Angelou" },
  { text: "Great minds discuss ideas. Average minds discuss events. Small minds discuss people.", author: "Eleanor Roosevelt" },
  { text: "The difference between ordinary and extraordinary is that little extra.", author: "Jimmy Johnson" },
  { text: "Life begins at the end of your comfort zone.", author: "Neale Donald Walsch" },
  { text: "Absorb what is useful, discard what is not, add what is uniquely your own.", author: "Bruce Lee" },
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
