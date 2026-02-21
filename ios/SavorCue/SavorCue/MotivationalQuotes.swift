import Foundation

enum MotivationalQuotes {
    static let stopEating: [String] = [
        // Okinawan wisdom
        "Hara hachi bu — eat until you are 80% full.",
        "Stop at 80% full. Your body will do the rest.",
        "The Okinawan secret to longevity: leave the table a little hungry.",

        // Michael Matthews / fitness mindset
        "Discipline is doing what needs to be done, even when you don't want to.",
        "Your fitness goals are built one meal at a time — make this one count.",
        "The body you want is earned in moments exactly like this one.",
        "Real strength is putting the fork down when your body says enough.",
        "Champions aren't made by how much they eat, but by how wisely they stop.",
        "Muscle is built in the gym. It's preserved at the dinner table.",
        "Calories you don't eat are the easiest ones to manage.",
        "Your next workout will thank you for stopping now.",
        "The best pre-workout is a meal that doesn't leave you overstuffed.",
        "Eating past fullness never built a better body.",
        "Progress is a choice you make right now, at this exact moment.",

        // Mindful eating
        "Your body sent the signal. Honor it.",
        "Satisfaction is not the same as stuffed.",
        "Mindful eating is the most powerful diet you'll ever follow.",
        "The meal is done when you're satisfied, not when the plate is empty.",
        "Eating slowly gives your brain time to catch up. You're already there.",
        "Pause. Breathe. You've had enough.",
        "True nourishment ends at satisfaction, not at discomfort.",
        "Your hunger is a guide, not a command.",
        "Taste every bite — you've already tasted enough.",
        "The best part of any meal is leaving it feeling good.",
        "You ate to live. You don't need to live to eat more right now.",
        "Listen to your body — it's the most honest nutritionist you have.",
        "Food is information. Your body has received the message.",

        // Stop before stuffed
        "Leave the table feeling light, not heavy.",
        "Overeating today is just borrowing discomfort from your future self.",
        "You'll feel better in 20 minutes if you stop now.",
        "The discomfort of stopping is nothing compared to the discomfort of overeating.",
        "A little hunger after eating is a sign your body is working perfectly.",
        "Stop before you're full — fullness arrives 20 minutes after your last bite.",
        "Your stomach is a fist-sized organ. It doesn't need a mountain of food.",
        "Leftovers exist for a reason. Use them.",
        "You can always eat again later. You can't un-eat right now.",
        "The food will still exist tomorrow. Your health depends on today.",

        // Self-discipline
        "Self-discipline is the bridge between goals and accomplishment.",
        "Every time you choose discipline over impulse, you grow stronger.",
        "The moment of choice defines who you are.",
        "Small acts of restraint compound into extraordinary results.",
        "Willpower is like a muscle — every small win makes it stronger.",
        "You are not controlled by the food in front of you.",
        "The hardest part is already done — you recognized you're full.",
        "Resist the urge once, and it becomes easier every time after.",
        "You've come this far. Don't undo it with one more bite.",
        "Master the moment. Master your health.",

        // Japanese philosophy
        "Ikigai begins with taking care of the body you have.",
        "In Japan, the art of eating less is called kenkou — healthy living.",
        "Wa — harmony — starts with balance at every meal.",
        "Eat to live a long, joyful life — not just for this moment.",

        // Stoic / mindset
        "You are the master of your appetite, not its servant.",
        "What the wise person desires, they take in moderation.",
        "The obstacle of hunger is overcome. Now overcome the habit of excess.",
        "Seneca: 'Eat to satisfy nature, not to pleasure the senses.'",
        "Marcus Aurelius: 'You have power over your mind, not outside events.'",
        "The Stoic sees the extra bite for what it is — an indulgence, not a need.",
        "Victory over small things leads to victory over large ones.",
        "Temperance is the foundation of all virtue — including health.",

        // Gut / digestion
        "Your digestive system needs space to work. Give it some.",
        "Overeating stresses every organ in your body. Your gut says stop.",
        "A full stomach can't absorb nutrients efficiently. Less is more.",
        "Eat for the energy you need, not the volume you crave.",
        "Digestion improves dramatically when you stop before overeating.",

        // Simple reminders
        "Put the fork down. You're good.",
        "Step away from the plate. You've got this.",
        "That's enough. And that's a good thing.",
        "You're full. Everything else is just habit.",
        "Your body knows. Trust it.",
        "The craving is just a habit. You're stronger than a habit.",
        "This is the moment. Choose well.",
        "You don't need more. You need to trust what you already have.",
        "The best meal ends before regret begins.",
        "Full is a feeling. Stuffed is a consequence.",
        "Enough is a decision, not a feeling.",
        "Eat less. Feel more.",
        "Your body is not a trash can for extra bites.",
        "The food will be there tomorrow. Your wellness must be, too.",
        "One more bite is rarely just one more bite.",
        "Stop here. You'll be proud in an hour.",
        "This is where the real meal ends — when you choose to stop.",
        "Less on the plate, more in the tank.",
        "The satisfied feeling is already on its way. Let it arrive.",

        // Longevity / health
        "The longest-lived people in the world all eat a little less than they could.",
        "Blue Zone inhabitants stop before full — every single time.",
        "Eating less consistently is the most powerful longevity tool we know.",
        "In Sardinia, meals end with conversation, not seconds.",
        "The centenarians of Okinawa share one habit: stopping before fullness.",

        // Encouragement
        "You started this meal with intention. End it the same way.",
        "Every good decision builds momentum. This is one of them.",
        "Health is the sum of thousands of small choices. This is one of them.",
        "You're not depriving yourself — you're respecting yourself.",
        "Future you is watching this moment. Make them proud.",
        "The discipline you practice today is the health you enjoy tomorrow.",
        "Your body deserves the best — and the best means stopping when it's right.",
        "Every meal is a chance to make a choice you'll be proud of.",
        "Gratitude for food means respecting your body enough to stop.",
        "You've already won by recognizing you're full — now act on it.",
        "The goal is not an empty plate. The goal is a healthy, energized you.",
        "Stopping now is the single best investment you can make in your future health."
    ]

    static func random() -> String {
        guard let quote = stopEating.randomElement() else {
            preconditionFailure("stopEating quotes array must not be empty")
        }
        return quote
    }
}
