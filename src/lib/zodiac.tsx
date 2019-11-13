import * as React from "react";
import * as horoscope from "horoscope";
import { getMonth, getDay } from "date-fns/esm";
import {
  IconName,
  IconCancer,
  IconCapricorn,
  IconSagittarius,
  IconAries,
  IconTaurus,
  IconGemini,
  IconLeo,
  IconAquarius,
  IconPisces,
  IconVirgo,
  IconLibra,
  IconScorpio
} from "../components/Icon";

export enum ZodiacSign {
  cancer = IconName.cancer,
  capricorn = IconName.capricorn,
  sagittarius = IconName.sagittarius,
  aries = IconName.aries,
  taurus = IconName.taurus,
  gemini = IconName.gemini,
  leo = IconName.leo,
  aquarius = IconName.aquarius,
  pisces = IconName.pisces,
  virgo = IconName.virgo,
  libra = IconName.libra,
  scorpio = IconName.scorpio
}

export const getSign = (date: Date): ZodiacSign => {
  // const formatted = format(date, "MM/DD/YYYY");

  const sign = horoscope.getSign({
    day: (getDay(date) % 7) + 1,
    month: getMonth(date) + 1
  });

  return ZodiacSign[sign.toLowerCase()];
};

export const ZodiacIcon = ({ sign, ...props }) => {
  const IconComponent = {
    [ZodiacSign.cancer]: IconCancer,
    [ZodiacSign.capricorn]: IconCapricorn,
    [ZodiacSign.sagittarius]: IconSagittarius,
    [ZodiacSign.aries]: IconAries,
    [ZodiacSign.taurus]: IconTaurus,
    [ZodiacSign.gemini]: IconGemini,
    [ZodiacSign.leo]: IconLeo,
    [ZodiacSign.aquarius]: IconAquarius,
    [ZodiacSign.pisces]: IconPisces,
    [ZodiacSign.virgo]: IconVirgo,
    [ZodiacSign.libra]: IconLibra,
    [ZodiacSign.scorpio]: IconScorpio
  }[sign];

  return <IconComponent {...props} />;
};

export const COPY_BY_SIGN = {
  [ZodiacSign.aries]: `Aries loves to be number one, so it’s no surprise that these audacious rams are the first sign of the zodiac. Bold and ambitious, Aries dives headfirst into even the most challenging situations (which is appropriate, since the body part associated with Aries is the head). Like their fellow fire signs, Leo and Sagittarius, Aries is a passionate, motivated, and confident leader who builds community with their cheerful disposition and relentless determination. Uncomplicated and direct in their approach, they often get frustrated by exhaustive details and unnecessary nuances. They like things quick and dirty, a temperament also reflected in their sexual proclivities.

Aries is a cardinal sign that kicks off not only the spring season but also the entire zodiac wheel. Astrologers believe that each sign learns the lessons absorbed by its preceding signs, both joyful and painful. In the case of Aries, however, there is no inherited wisdom: Aries leads with blind optimism, barreling through life with an electric joie de vivre that perfectly complements their distinctive impulsivity. These fire signs think after they leap, which often results in lessons learned the hard way. Aries represents the singular spirit (while Aries’s opposite sign, Libra, symbolizes partnership). These rams adhere to an “every person for themselves” philosophy. While this self-determination can be inspiring, Aries needs to watch out for selfish tendencies.

Aries is ruled by Mars, the dynamic red planet named after the Roman god of war. Accordingly, these courageous rams are always armed and ready for battle. Aries is known for an explosive temper, and although their outbursts don’t last long, it’s definitely best to avoid fiery rams until the steam has dissipated. But when these brazen rams are not flying off the handles, they’re upbeat, positive, and playful creatures who enjoy living life to its fullest. You can always be sure to spot an Aries excelling on the sports field, speeding down the highway, or organizing a vibrant party game.`,
  [ZodiacSign.gemini]: `Have you ever been so busy that you wished you could clone yourself just to get everything done? That’s the Gemini experience in a nutshell. Appropriately symbolized by the celestial twins, this air sign was interested in so many pursuits that it had to double itself. Because of Geminis' intrinsic duality, they're often falsely misrepresented as two-faced. In reality, however, Gemini rarely has hidden agendas. Playful and intellectually curious, Gemini is constantly juggling a variety of passions, hobbies, careers, and friend groups. They are the social butterflies of the zodiac: These quick-witted twins can talk to anyone about anything. Find them buzzing between happy hours, dinner parties, and dance floors.

Gemini season begins on May 21, a day that ushers in the heat and electricity of summer. Gemini is accordingly excellent at guiding change and transformation. These curious twins are terrific pioneers, using their energy to spearhead innovative creative projects. A fearless thinker, Gemini is always down to try something new. But after they have shared their progressive vision with the world, it’s best to let these twins get back to ideating: These hyperactive air signs have short attention spans and are most satisfied when they can move fluidly from one idea to the next.

Both Gemini and Virgo are governed by Mercury, the messenger planet of communication. Despite sharing a planetary ruler, however, these two signs are opposite in their approaches: Gemini expresses emotions externally, whereas Virgo processes internally. Gemini is all about output, so these twins love to chat and often speak with their hands (which happens to be the body part associated with Gemini). Communication is paramount for them, and they require fluent streams of transmission. They love texting and tweeting almost as much as they love talking IRL. In fact, the act of expression is often even more important to loquacious Gemini than what is actually being said, and they must remember to be thoughtful with their words. Another incredible Gemini quality, however, is that these natural chameleons can quickly recover from even the most shameful foot-in-mouth moments. Gemini moves too fast to care about embarrassing missteps: They simply move on.`,
  [ZodiacSign.cancer]: `Cancer is a cardinal water sign. Represented by the crab, this oceanic crustacean seamlessly weaves between the sea and shore, representing Cancer’s ability to exist in both emotional and material realms. Cancers are highly intuitive, and their psychic abilities manifest in tangible spaces: For instance, Cancers can effortlessly pick up the energies of a room. These crabs are highly sensitive to their environments, as well as extremely self-protective. Much like their celestial spirit animal, Cancers are shielded by hard, external shells. At first, these crabs may be perceived as cold or distant. With time, though, Cancers reveal their gentle nature, genuine compassion, and mystical capabilities. Just don't be surprised if it takes a while to get to know them.

Cancer is ruled by the moon, the celestial body that represents comfort, self-care, and maternal energies. Accordingly, Cancers tend to be domestically oriented. They love to create cozy, safe spaces that serve as their personal sanctuaries, then spend lots of time in them. Cancers care deeply about their families and are quick to adopt caregiver roles. But these crabs must be careful: When Cancers invest in someone emotionally, they risk blurring the line between attentive nurturing and controlling behavior.

Cancers attract friends and lovers through their loyalty, commitment, and emotional depth. These crustaceans make excellent hosts and enjoy entertaining with comfort food and free-flowing libations. (Cancer rules the stomach, so there’s nothing these crabs love more than a home-cooked meal.) If you're not a fan of Cancer’s attachment to the home, that may be a bit of a problem. Though these celestial crabs avoid direct conflict by walking at an angle, they can inflict a harsh pinch with their distinctive brand of passive-aggressiveness. It may be difficult to convince a Cancer to talk openly about what's bothering them, but if you can do it without making them feel threatened, you'll build long-lasting trust.`,
  [ZodiacSign.leo]: `Roll out the red carpet, because Leo has arrived. Leo is represented by the lion, and these spirited fire signs are the kings and queens of the celestial jungle. They’re delighted to embrace their royal status: Vivacious, theatrical, and passionate, Leos love to bask in the spotlight and celebrate themselves. These lions are natural leaders, and they enjoy cultivating friendships and romances that are artistically and creatively inspired. Playful Leos have no problem leaning into drama-fueled romances that are perfectly suited for the tabloids. (In fact, they may even prefer them.) After all, every Leo perceives him or herself as a celebrity. These astrological divas never get tired of lavish dinners, exclusive parties, or decadent designer wear.

Leo is ruled by the sun, the dazzling celestial body that governs life and vitality. The sun never goes retrograde, and likewise, Leos are renowned for their stability, loyalty, and consistency. They are dedicated friends and lovers who put their heart into every relationship. (Fittingly, the Leo sign governs the heart.) Lions love to watch their mates succeed — until they feel threatened. They can become impaired by their ego, pride, and jealousy when they start to fear their star power will be eclipsed. It’s important for celestial lions to remember that their light is never obscured by others, and the bright shine of others' success does nothing to their own. Ultimately, Leos' own hubris is the greatest threat to their happiness.

This fixed sign is known for its ambition and determination, but above all, Leos are celebrated for their remarkable bravery. In tarot, Leo is represented by the “strength” card, which depicts the divine expression of physical, mental, and emotional fortitude. Fearless optimists who refuse to accept failure, Leos will find their deep wells of courage grow as they mature.`,
  [ZodiacSign.libra]: `Libra is an air sign represented by the scales (interestingly, the only inanimate object of the zodiac), an association that reflects Libra's fixation on balance and harmony. Libra is obsessed with symmetry and strives to create equilibrium in all areas of life. These air signs are the aesthetes of the zodiac: Ruled by Venus, the planet that governs love, beauty, and money, Libras adore high art, intellectualism, and connoisseurship. Suave Libras need to surround themselves with stunning objects and create environments that reflect their exquisite tastes. Accordingly, these air signs make excellent designers, decorators, art critics, and stylists.

While Libra's opposite sign, Aries, represents “me,” Libra symbolizes “we.” Relationships are paramount for Libras, who find balance in companionship. They love harmonious partnerships with fashionable mates, especially those who make attractive arm candy. (Libra governs the skin, and these air signs are highly motivated by physical appearances. There's no way Libra would rather relax than with a luxurious face mask.) Libras are regularly coupled, and when they are, they must be careful about seeking attention outside the agreed-upon boundaries of their relationships. Since they try to keep everyone happy and engaged, they may find themselves tempted to push the limits of their agreements with their partners. People-pleasing Libras must remember that the happiness of their loved ones and the health of their relationships is more important than maintaining the attention of distant admirers.

Libra is a cardinal sign, which means Libras are accordingly great at launching new initiatives. Because Libras consider multiple perspectives in all pursuits, however, these air signs struggle with indecision. Instead of constantly seeking outside perspectives, Libras would do well to develop (and trust) their own intuition. Their characteristic ambivalence aside, Libras can navigate virtually any social situation, effortlessly resolving conflicts by simply turning on the charm.`,
  [ZodiacSign.scorpio]: `Scorpio is one of the most misunderstood signs of the zodiac. Because of its incredible passion and power, Scorpio is often mistaken for a fire sign. In fact, Scorpio is a water sign that derives its strength from the psychic, emotional realm. Like its fellow water signs, Cancer and Pisces, Scorpio is extremely clairvoyant and intuitive.

What makes this water sign unique is its distinctive venomous sting. Like their celestial spirit animal, the scorpion, Scorpios lie in wait and strike when least expected. Life is a game of chess for these calculating water signs, who are constantly plotting several steps ahead in order to orchestrate an eventual checkmate. This doesn't mean their intentions are necessarily nefarious. Scorpios simply know what they want and aren't afraid to work hard and play the long game to get it. They never show their cards, and their enigmatic nature is what makes them so seductive and beguiling. Scorpio is the sign most closely associated with sex: The part of the body that Scorpio governs is the genital area. Sex isn't about solely about pleasure for these sensual scorpions, either: They also crave the physical closeness, spiritual illumination, and emotional intimacy that sex can provide.

Scorpio is ruled by Pluto, the planet that governs both destruction and transformation. On a good day, Scorpionic energy is ambitious and enticing. On a bad day, however, the shadowy side of Scorpio is fueled by a relentless desire for control. Power-hungry Scorpios must remember that, if controlled by their egos, they are at risk of poisoning themselves. This sign is at its best when its intrinsic intensity is applied to deep, soulful connections with friends and lovers. When they build trust with others, Scorpios demonstrate unparalleled empathy, depth, and commitment which brighten even the darkest parts of Scorpio’s magical psyche.`,
  [ZodiacSign.sagittarius]: `Represented by the archer, Sagittarians are always on a quest for knowledge.

The last fire sign of the zodiac, Sagittarius launches its many pursuits like blazing arrows, chasing after geographical, intellectual, and spiritual adventures. Fueled by wanderlust, these archers can be found traversing all corners of the world on thrill-seeking expeditions.

It's no surprise that Jupiter, the planet of abundance, spirituality, and growth, governs Sagittarius. With so many journeys under their belt, Sagittarians are excellent storytellers and can light up any room with their exhilarating tales and infectious laughter. Effortlessly magnetic, Sags easily attract friends and lovers with their senses of humor. They're the comedians of the zodiac and infuse all of their conversations with wit and "no bullshit" bluntness. While their bon mots are unmatched, Sags must remember to keep their sharp tongues in check. Though they know a lot, they don’t know everything — and if they're not careful, they can come off as pretentious or arrogant.

Sagittarius is a mutable sign, meaning it is associated with adaptability and flexibility. This perfectly reflects the archers’ deep-rooted desire for change. Sagittarians are born to explore, and it is critical that these archers have the freedom to roam. (Sagittarius rules the thighs, so these archers are always on the move.) Romantically, Sagittarians seek a copilot: These adventurous lovers resent any boundaries, so constant motion is essential in any Sag relationship. If you are lucky enough to link up with one of these archers, be sure to buckle up and have your passport ready. With Sagittarius, it’s always a wild ride.

`,
  [ZodiacSign.capricorn]: `The last earth sign of the zodiac, Capricorn is represented by the sea goat, a mythological creature with the body of a goat and tail of a fish. Accordingly, Capricorns are skilled at navigating both the material and emotional realms. They scale the steepest mountains — Capricorn rules the knees, making it easier for this sign to climb — while simultaneously exploring their psychic strengths. Capricorns tap into their inner fortitude to overcome whatever stands between them and their long-term goals, and they don’t let anything distract them from getting ahead. Because of their unwavering focus, however, they are often perceived as cold and unemotional. Sea goats must remember that not every success in life can be featured on a résumé and that compassion is as important as any professional advancement.

Capricorn is ruled by taskmaster Saturn, the stoic planet that governs time and restrictions. Saturn's transits always teach us tough lessons, but Capricorn is no stranger to growing pains. With Saturn guiding the Capricorn constellation, many sea goats were exposed to difficulties at an early age. Interestingly, Capricorns are said to age backward: Having already endured hardships, Capricorns become increasingly youthful, optimistic, and playful as they mature. Indeed, inside every earnest Capricorn is a mischievous troublemaker (in tarot, Capricorn is symbolized by the "devil" card). Though this earth sign may seem a bit conservative and restrained at first, Capricorn’s closest friends and lovers know that these sea goats love to party.

A cardinal sign, Capricorn is excellent at taking action and launching initiatives. Capricorn’s can-do attitude leads to success in pretty much any industry. While they're terrific leaders, they must also be mindful about their workaholic tendencies. It’s important for Capricorn to maintain a healthy work-life balance and avoid treating their friends and partners like their assistants. Resist the temptation to ask your partner to proofread that work email tonight, Cap, and connect with them on something other than what happened at the office.`,
  [ZodiacSign.virgo]: `Virgo is an earth sign historically represented by the goddess of wheat and agriculture, an association that speaks to Virgo’s deep-rooted presence in the material world. Virgos are logical, practical, and systematic in their approach to life. This earth sign is a perfectionist at heart and isn’t afraid to improve skills through diligent and consistent practice. Virgo rules the digestive system, which makes these earth signs especially attuned to the ingredients that make up a whole — in food and in everything else. They're hyper-aware of every detail.

Virgo is governed by Mercury, the messenger planet of communication. Though Mercury also rules Gemini, these two signs are radically different: Gemini is about output and expression, whereas Virgo is about input and processing. A Virgo deals with information like a computer, transforming even the most jumbled set of information into organized, clear concepts. Though Virgos long to be meticulous in all pursuits, they must remember that constantly chasing after the ideal can be destructive when applied to self or others. Beauty exists within our imperfections, and it’s important for Virgos to learn that flaws are not defects.

Above all else, Virgos want to help. They are kind, gentle, and supportive friends and lovers who use their incredible intellect and resourcefulness to problem-solve. Virgo's opposite sign, Pisces, offers guidance through spirituality, but Virgos want to assist on a practical level. These earth signs are always striving to provide workable solutions and improve broken systems. Methodical, committed, and hardworking, they make excellent teachers, healers, editors, and musicians.`,

  [ZodiacSign.taurus]: `Taurus is an earth sign represented by the bull. Like their celestial spirit animal, Taureans enjoy relaxing in serene, bucolic environments, surrounded by soft sounds, soothing aromas, and succulent flavors. Taurus is ruled by Venus, the enchanting planet that governs love, beauty, and money. Taurus’s Venusian influence make this earth sign the most sensual of the zodiac: These cosmic oxen are enchanted by any physical manifestation of comfort and luxury. Pleasure is a necessity for epicurean Taureans, and they feel most content when pampered. (Taurus governs the neck, so neck caresses are especially irresistible to these bulls.)

It's true that in their perfect world, Taureans would spend all day bathing in a tub overflowing with essential oils. At the same time, these earth signs know the value of a dollar. Taureans aren’t afraid to roll up their sleeves and work hard to earn big rewards. These earth signs are ambitious, focused, and resilient, and they feel most secure when steadily putting money away into a savings account. Cosmic oxen are all about return on investment (the bull is also the symbol of Wall Street), and Taureans know how to play the long game in both professional and romantic pursuits. Security is paramount for Taureans, and any threat to their stability will be sure to have a celestial bull seeing red.

As a sign, Taurus is fixed, an astrological quality that reflects Taurus’s steadfast, loyal nature. Fixed signs are excellent at maintaining systems, and Taureans prioritize consistency and reliability in all areas of their lives. It must be noted, however, that Taurus does have a bit of a reputation: What a Taurus perceives as dedication is often regarded by others as stubbornness. Accordingly, these bulls may end up lingering in unhealthy situations — whether relationships, jobs, or homes — longer than necessary just to prove a point. Despite their occasional obstinance, however, Taureans are dependable partners, soothing their friends and lovers through their trustworthiness and devotion.`,
  [ZodiacSign.pisces]: `Pisces, a water sign, is the last constellation of the zodiac. It's symbolized by two fish swimming in opposite directions, representing the constant division of Pisces's attention between fantasy and reality. As the final sign, Pisces has absorbed every lesson — the joys and the pains, the hopes and the fears — learned by all of the other signs. This makes these fish the most psychic, empathetic, and compassionate creatures of the astrological wheel. With such immense sensitivity, Pisces can easily become swallowed by emotions and must remember to stay grounded in the material realm (appropriately, Pisces rules the feet).

Pisces is ruled by Neptune, the celestial body that governs creativity and dreams, and these ethereal fish adore exploring their boundless imaginations. In its more nefarious form, however, Neptune also oversees illusion and escapism. Neptunian energy is like the of the ocean: magical, mysterious, and often scary. When the fog is thick on the water, the horizon is obstructed and there is no differentiation between the sea and the sky. Pisces must be wary of mirages: These impressionable fish prefer wearing rose-colored glasses to addressing problems, which can earn Pisces a reputation for being flaky or delusional. This water sign should remember that problems can't be solved by swimming away. Willful ignorance never makes conflict disappear: It only gives it the chance to grow.

A mutable sign, Pisces effortlessly adapts to their surroundings. These visionary fish have unparalleled access to the collective unconscious through their clairvoyance and make incredible artists and creatives. Kind and gentle, they're invigorated by shared experiences of music and romance. Any relationship with mystical Pisces is guaranteed to involve deep spiritual exploration.
`,

  [ZodiacSign.aquarius]: `Despite the “aqua” in its name, Aquarius is actually the last air sign of the zodiac. Aquarius is represented by the water bearer, the mystical healer who bestows water, or life, upon the land. Accordingly, Aquarius is the most humanitarian astrological sign. These revolutionary thinkers fervently support “power to the people,” aspiring to change the world through radical social progress. Every Aquarian is a rebel at heart: These air signs despise authority and anything that represents conventionality. Free-spirited and eccentric, they can often be identified by their offbeat fashion sensibilities, unusual hobbies, and nonconformist attitude.

Aquarius is ruled by Uranus, the planet that governs innovation, technology, and surprising events. Uranus perfectly mirrors Aquarius's distinctive attitude, complementing the nontraditional nature of these visionary air signs. Aquarians are big thinkers, but mustn't forget their immediate surroundings. These water bearers can become so focused on implementing widespread reform that they neglect their family and friends, gaining a reputation for being aloof and distant in relationships. Aquarians should remember that progress always starts on a micro level, advocating empathy and compassion wherever possible.

Like Taurus, Leo, and Scorpio, the other fixed signs of the zodiac, Aquarius can have a bit of a stubborn streak. This is often considered an Achilles’ heel. (In fact, in medical astrology, Aquarius governs the ankles.) Aquarian obstinacy stems from strong, righteous conviction, and it's quelled as soon as an Aquarius gets the chance to enact change. Because these water bearers are so deeply motivated by the spirit of egalitarianism, they enjoy teamwork and participating in communities of like-minded individuals.`
};
