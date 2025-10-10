export interface UsageSentence {
  text: string;
  isCorrect: boolean;
}

export interface UsagePredefinedEntry {
  sentences: UsageSentence[]; // exactly 4: 1 correct (true) + 3 incorrect (false)
}

// Predefined Natural Usage sentences for IELTS sets.
// Keys are lowercased words. Sentences are shown verbatim.
export const USAGE_PREDEFINED: Record<string, UsagePredefinedEntry> = {
  // 🎓 Academic Life
  lecture: {
    sentences: [
      { text: 'The professor delivered an engaging lecture on climate change and public policy.', isCorrect: true },
      { text: 'Students must submit lecture assignments by Friday.', isCorrect: false },
      { text: 'She conducted extensive lecture on renewable energy projects.', isCorrect: false },
      { text: 'In many cases, the spring lecture begins in January.', isCorrect: false },
    ],
  },
  assignment: {
    sentences: [
      { text: 'Please submit your group assignment before the deadline next Tuesday.', isCorrect: true },
      { text: 'The university announced a guest assignment for next week’s event.', isCorrect: false },
      { text: 'She’s preparing her assignment schedule for this semester’s classes.', isCorrect: false },
      { text: 'The professor delivered a fascinating assignment on global warming.', isCorrect: false },
    ],
  },
  research: {
    sentences: [
      { text: 'Their team is conducting research on water scarcity in urban areas.', isCorrect: true },
      { text: 'The dean will give a research about the new grading system.', isCorrect: false },
      { text: 'Students attended a public research yesterday at the main hall.', isCorrect: false },
      { text: 'The library closes early during the research.', isCorrect: false },
    ],
  },
  semester: {
    sentences: [
      { text: 'Most first-year students take four subjects each semester.', isCorrect: true },
      { text: 'The scientist continued her semester on environmental issues.', isCorrect: false },
      { text: 'Please print your semester before submitting your paper.', isCorrect: false },
      { text: 'The lecture was scheduled after the semester deadline.', isCorrect: false },
    ],
  },
  deadline: {
    sentences: [
      { text: 'The deadline for submitting applications is the end of this month.', isCorrect: true },
      { text: 'They attended a deadline about environmental awareness.', isCorrect: false },
      { text: 'Students discussed the new deadline on water treatment.', isCorrect: false },
      { text: 'The professor gave a deadline every morning at nine.', isCorrect: false },
    ],
  },

  // 🌍 Environment & Climate
  pollution: {
    sentences: [
      { text: 'The government is working to reduce air pollution in large cities.', isCorrect: true },
      { text: 'The team installed a pollution to improve water systems.', isCorrect: false },
      { text: 'She’s preparing a pollution project about solar energy.', isCorrect: false },
      { text: 'The park introduced new pollution made of recycled materials.', isCorrect: false },
    ],
  },
  sustainable: {
    sentences: [
      { text: 'The company is investing in sustainable energy solutions for factories.', isCorrect: true },
      { text: 'The manager gave a sustainable about office security.', isCorrect: false },
      { text: 'Researchers collected sustainable from river samples.', isCorrect: false },
      { text: 'The city opened a new sustainable downtown museum.', isCorrect: false },
    ],
  },
  ecosystem: {
    sentences: [
      { text: 'Forests play an essential role in maintaining a healthy ecosystem.', isCorrect: true },
      { text: 'The mayor launched a new ecosystem about recycling habits.', isCorrect: false },
      { text: 'We printed the full ecosystem before leaving the meeting.', isCorrect: false },
      { text: 'Students visited a ecosystem in the city center.', isCorrect: false },
    ],
  },
  emissions: {
    sentences: [
      { text: 'Vehicle emissions have decreased since the introduction of electric cars.', isCorrect: true },
      { text: 'The scientists compared different emissions of energy plants.', isCorrect: false },
      { text: 'The minister announced a new emissions for building design.', isCorrect: false },
      { text: 'Volunteers cleaned rivers filled with plastic emissions.', isCorrect: false },
    ],
  },
  renewable: {
    sentences: [
      { text: 'Solar panels are one of the most popular renewable technologies today.', isCorrect: true },
      { text: 'The government hired a renewable for economic reforms.', isCorrect: false },
      { text: 'The professor gave a renewable last week on tourism.', isCorrect: false },
      { text: 'The factory plans to export renewable furniture abroad.', isCorrect: false },
    ],
  },

  // 💻 Technology & Innovation
  artificial: {
    sentences: [
      { text: 'Many smartphones now use artificial intelligence to improve camera quality.', isCorrect: true },
      { text: 'The engineer designed a new artificial for urban traffic.', isCorrect: false },
      { text: 'She joined an artificial about online marketing.', isCorrect: false },
      { text: 'The factory builds an artificial on weekends.', isCorrect: false },
    ],
  },
  digital: {
    sentences: [
      { text: 'Many schools are moving to fully digital textbooks and learning materials.', isCorrect: true },
      { text: 'We installed a new digital in the city park.', isCorrect: false },
      { text: 'The chef shared a digital on healthy recipes.', isCorrect: false },
      { text: 'The scientist published a digital of poetry last month.', isCorrect: false },
    ],
  },
  algorithm: {
    sentences: [
      { text: 'The app uses an algorithm to recommend personalized study materials.', isCorrect: true },
      { text: 'Students attended an algorithm about financial aid.', isCorrect: false },
      { text: 'She uploaded the latest algorithm to the library database.', isCorrect: false },
      { text: 'The mayor opened an algorithm to discuss city planning.', isCorrect: false },
    ],
  },
  automation: {
    sentences: [
      { text: 'The factory introduced automation to reduce costs and increase efficiency.', isCorrect: true },
      { text: 'Engineers completed their automation in the new science course.', isCorrect: false },
      { text: 'The manager wrote an automation to the company board.', isCorrect: false },
      { text: 'The lab held an automation about organic farming.', isCorrect: false },
    ],
  },
  breakthrough: {
    sentences: [
      { text: 'The new vaccine was a major breakthrough in medical research.', isCorrect: true },
      { text: 'They attended a breakthrough on digital art techniques.', isCorrect: false },
      { text: 'Scientists delivered a short breakthrough about parking systems.', isCorrect: false },
      { text: 'Students uploaded the breakthrough before lunch.', isCorrect: false },
    ],
  },

  // 🩺 Health & Medicine
  diagnosis: {
    sentences: [
      { text: 'The doctor made a quick diagnosis after reviewing the patient’s symptoms.', isCorrect: true },
      { text: 'The nurse prepared a diagnosis for hospital expansion.', isCorrect: false },
      { text: 'Researchers gave a public diagnosis about fitness.', isCorrect: false },
      { text: 'The clinic opened a new diagnosis near the coast.', isCorrect: false },
    ],
  },
  symptom: {
    sentences: [
      { text: 'A sore throat is often the first symptom of a cold.', isCorrect: true },
      { text: 'The clinic announced a symptom for patient safety.', isCorrect: false },
      { text: 'He presented a new symptom on sleep habits.', isCorrect: false },
      { text: 'The doctor gave a symptom about vaccines.', isCorrect: false },
    ],
  },
  treatment: {
    sentences: [
      { text: 'Early treatment can prevent the spread of many infections.', isCorrect: true },
      { text: 'The conference discussed a treatment about mental health.', isCorrect: false },
      { text: 'She collected data for a treatment presentation.', isCorrect: false },
      { text: 'He submitted his treatment to the ministry.', isCorrect: false },
    ],
  },
  prevention: {
    sentences: [
      { text: 'Regular exercise plays a key role in disease prevention.', isCorrect: true },
      { text: 'The hospital opened a prevention for community meetings.', isCorrect: false },
      { text: 'Students presented a prevention on food waste.', isCorrect: false },
      { text: 'The doctor received a prevention from her manager.', isCorrect: false },
    ],
  },
  immunity: {
    sentences: [
      { text: 'Good nutrition can help strengthen your immunity against illness.', isCorrect: true },
      { text: 'The nurse published a immunity about health policy.', isCorrect: false },
      { text: 'The team attended a immunity in medical law.', isCorrect: false },
      { text: 'She was awarded a immunity for her research.', isCorrect: false },
    ],
  },

  // 💼 Business & Economics
  profit: {
    sentences: [
      { text: 'The company reported a record profit this financial year.', isCorrect: true },
      { text: 'The meeting discussed a profit about marketing.', isCorrect: false },
      { text: 'Employees attended a profit on career development.', isCorrect: false },
      { text: 'The bank opened a new profit downtown.', isCorrect: false },
    ],
  },
  investment: {
    sentences: [
      { text: 'Many young professionals are interested in investment opportunities abroad.', isCorrect: true },
      { text: 'The board scheduled a investment about teamwork.', isCorrect: false },
      { text: 'The director wrote a investment for next semester.', isCorrect: false },
      { text: 'Our group visited an investment for a case study.', isCorrect: false },
    ],
  },
  inflation: {
    sentences: [
      { text: 'Rising inflation makes it harder for families to afford daily goods.', isCorrect: true },
      { text: 'The government announced a inflation on food exports.', isCorrect: false },
      { text: 'She attended an inflation in New York.', isCorrect: false },
      { text: 'The city hosted a inflation for small businesses.', isCorrect: false },
    ],
  },
  entrepreneur: {
    sentences: [
      { text: 'The young entrepreneur launched a new app that teaches financial literacy.', isCorrect: true },
      { text: 'He completed an entrepreneur on health care.', isCorrect: false },
      { text: 'They published their entrepreneur on leadership ethics.', isCorrect: false },
      { text: 'The company sponsored a entrepreneur competition abroad.', isCorrect: false },
    ],
  },
  consumer: {
    sentences: [
      { text: 'Today’s consumer expects faster delivery and eco-friendly packaging.', isCorrect: true },
      { text: 'The manager gave a consumer for project deadlines.', isCorrect: false },
      { text: 'They opened a consumer to promote tourism.', isCorrect: false },
      { text: 'The workers attended a consumer last night.', isCorrect: false },
    ],
  },

  // 🏛 Government & Politics
  legislation: {
    sentences: [
      { text: 'The new legislation will protect citizens from online fraud.', isCorrect: true },
      { text: 'Parliament passed a legislation about recycling day.', isCorrect: false },
      { text: 'They attended a legislation on journalism.', isCorrect: false },
      { text: 'The mayor gave a legislation at graduation.', isCorrect: false },
    ],
  },
  democracy: {
    sentences: [
      { text: 'In a democracy, leaders are elected through free and fair voting.', isCorrect: true },
      { text: 'The town hosted a democracy for schoolchildren.', isCorrect: false },
      { text: 'The prime minister signed a democracy on education.', isCorrect: false },
      { text: 'They celebrated the annual democracy in July.', isCorrect: false },
    ],
  },
  policy: {
    sentences: [
      { text: 'The government introduced a new environmental policy to cut emissions.', isCorrect: true },
      { text: 'She wrote a policy on academic writing.', isCorrect: false },
      { text: 'The minister held a policy for community volunteers.', isCorrect: false },
      { text: 'They invited students to the policy conference.', isCorrect: false },
    ],
  },
  parliament: {
    sentences: [
      { text: 'The parliament voted in favor of the national healthcare reform.', isCorrect: true },
      { text: 'The city opened a parliament in the park.', isCorrect: false },
      { text: 'They joined a parliament for cultural events.', isCorrect: false },
      { text: 'A local teacher gave a parliament last week.', isCorrect: false },
    ],
  },
  campaign: {
    sentences: [
      { text: 'The charity launched a campaign to raise funds for homeless families.', isCorrect: true },
      { text: 'The students organized a campaign class on biology.', isCorrect: false },
      { text: 'Officials attended a campaign at the library.', isCorrect: false },
      { text: 'The museum hosted a campaign about ancient history.', isCorrect: false },
    ],
  },

  // 📰 Media & Communication
  broadcast: {
    sentences: [
      { text: 'The news channel will broadcast the president’s speech live tonight.', isCorrect: true },
      { text: 'The company will broadcast training manuals to new employees.', isCorrect: false },
      { text: 'They decided to broadcast a conference by email.', isCorrect: false },
      { text: 'The journalist will broadcast new office rules tomorrow.', isCorrect: false },
    ],
  },
  journalism: {
    sentences: [
      { text: 'She studied journalism because she loves telling real stories.', isCorrect: true },
      { text: 'He finished a journalism in engineering.', isCorrect: false },
      { text: 'The class attended a journalism for charity.', isCorrect: false },
      { text: 'The station announced a journalism this weekend.', isCorrect: false },
    ],
  },
  censorship: {
    sentences: [
      { text: 'Strict censorship limits what journalists can publish about the war.', isCorrect: true },
      { text: 'They installed a censorship at the radio studio.', isCorrect: false },
      { text: 'The editor prepared a censorship for students.', isCorrect: false },
      { text: 'The producer hosted a censorship on cooking shows.', isCorrect: false },
    ],
  },
  propaganda: {
    sentences: [
      { text: 'The dictator used propaganda to control public opinion.', isCorrect: true },
      { text: 'The editor printed a propaganda on healthy eating.', isCorrect: false },
      { text: 'They joined a propaganda about environmental law.', isCorrect: false },
      { text: 'The artist created a propaganda sculpture.', isCorrect: false },
    ],
  },
  editorial: {
    sentences: [
      { text: 'The newspaper published an editorial criticizing the education reform.', isCorrect: true },
      { text: 'The journalist attended an editorial on agriculture.', isCorrect: false },
      { text: 'The magazine opened a editorial exhibition.', isCorrect: false },
      { text: 'They discussed a editorial about building safety.', isCorrect: false },
    ],
  },

  // 🌍 Social Issues
  inequality: {
    sentences: [
      { text: 'Governments must address income inequality to create fairer societies.', isCorrect: true },
      { text: 'The school built a new inequality for local children.', isCorrect: false },
      { text: 'We discussed the inequality during yesterday’s climate workshop.', isCorrect: false },
      { text: 'The mayor announced a inequality for community sports.', isCorrect: false },
    ],
  },
  poverty: {
    sentences: [
      { text: 'Many families still live in extreme poverty despite economic growth.', isCorrect: true },
      { text: 'The minister opened a poverty downtown.', isCorrect: false },
      { text: 'Students wrote essays about water poverty treatment.', isCorrect: false },
      { text: 'She attended a poverty on renewable energy.', isCorrect: false },
    ],
  },
  discrimination: {
    sentences: [
      { text: 'Laws exist to protect workers from racial discrimination.', isCorrect: true },
      { text: 'The NGO organized a discrimination on health care.', isCorrect: false },
      { text: 'He studied discrimination at the university library.', isCorrect: false },
      { text: 'The judge delivered a discrimination yesterday.', isCorrect: false },
    ],
  },
  welfare: {
    sentences: [
      { text: 'The government expanded its welfare program to support single parents.', isCorrect: true },
      { text: 'The students designed a welfare for cultural exchange.', isCorrect: false },
      { text: 'A local company hosted a welfare about recycling.', isCorrect: false },
      { text: 'Residents voted for a welfare to repair city roads.', isCorrect: false },
    ],
  },
  diversity: {
    sentences: [
      { text: 'Universities value diversity among students from different backgrounds.', isCorrect: true },
      { text: 'The museum opened a diversity of modern art.', isCorrect: false },
      { text: 'They joined a diversity on traffic safety.', isCorrect: false },
      { text: 'The council passed a diversity about forest protection.', isCorrect: false },
    ],
  },

  // 🎨 Arts & Culture
  aesthetic: {
    sentences: [
      { text: 'The building’s aesthetic combines modern glass with classical stone.', isCorrect: true },
      { text: 'The artist discussed a aesthetic on climate research.', isCorrect: false },
      { text: 'Visitors watched a aesthetic about renewable energy.', isCorrect: false },
      { text: 'The writer received a aesthetic from the gallery.', isCorrect: false },
    ],
  },
  exhibition: {
    sentences: [
      { text: 'The museum opened a new exhibition of contemporary sculpture.', isCorrect: true },
      { text: 'Students attended an exhibition on climate law.', isCorrect: false },
      { text: 'The festival hosted a exhibition for young scientists.', isCorrect: false },
      { text: 'The company announced a exhibition policy last week.', isCorrect: false },
    ],
  },
  contemporary: {
    sentences: [
      { text: 'She prefers contemporary art to traditional landscape painting.', isCorrect: true },
      { text: 'The committee approved a contemporary on plastic waste.', isCorrect: false },
      { text: 'We registered for the contemporary at city hall.', isCorrect: false },
      { text: 'The school will host a contemporary in December.', isCorrect: false },
    ],
  },
  heritage: {
    sentences: [
      { text: 'The castle is part of our national heritage.', isCorrect: true },
      { text: 'The engineer published a heritage about energy sources.', isCorrect: false },
      { text: 'They organized a heritage for water conservation.', isCorrect: false },
      { text: 'The mayor introduced a heritage on public safety.', isCorrect: false },
    ],
  },
  masterpiece: {
    sentences: [
      { text: 'The Mona Lisa is often described as a true masterpiece.', isCorrect: true },
      { text: 'The university released a masterpiece on road design.', isCorrect: false },
      { text: 'He performed a masterpiece about air quality.', isCorrect: false },
      { text: 'The museum added a masterpiece to its climate section.', isCorrect: false },
    ],
  },

  // 🔬 Science & Research
  hypothesis: {
    sentences: [
      { text: 'The scientist tested her hypothesis through a controlled experiment.', isCorrect: true },
      { text: 'The students wrote a hypothesis about museum visits.', isCorrect: false },
      { text: 'We met to discuss the hypothesis funding policy.', isCorrect: false },
      { text: 'The lab cleaned its hypothesis after class.', isCorrect: false },
    ],
  },
  experiment: {
    sentences: [
      { text: 'Students conducted an experiment to test plant growth under low light.', isCorrect: true },
      { text: 'The professor gave an experiment on budget planning.', isCorrect: false },
      { text: 'We attended an experiment about tourism.', isCorrect: false },
      { text: 'The mayor opened a new experiment in town.', isCorrect: false },
    ],
  },
  evidence: {
    sentences: [
      { text: 'DNA provided clear evidence that confirmed the suspect’s identity.', isCorrect: true },
      { text: 'The doctor received an evidence from the ministry.', isCorrect: false },
      { text: 'She organized an evidence about public health.', isCorrect: false },
      { text: 'The school launched an evidence on transport.', isCorrect: false },
    ],
  },
  analysis: {
    sentences: [
      { text: 'The team’s analysis showed a strong link between diet and stress.', isCorrect: true },
      { text: 'He presented an analysis about cultural heritage.', isCorrect: false },
      { text: 'They wrote a analysis on local elections.', isCorrect: false },
      { text: 'The artist displayed his analysis in the gallery.', isCorrect: false },
    ],
  },
  methodology: {
    sentences: [
      { text: 'The methodology section explains how the study was conducted.', isCorrect: true },
      { text: 'The group delivered a methodology on traffic rules.', isCorrect: false },
      { text: 'Students practiced a methodology of creative writing.', isCorrect: false },
      { text: 'The company proposed a methodology for recycling.', isCorrect: false },
    ],
  },

  // ✈️ Travel & Tourism
  destination: {
    sentences: [
      { text: 'Paris remains the most popular destination for honeymooners.', isCorrect: true },
      { text: 'The manager gave a destination about local cuisine.', isCorrect: false },
      { text: 'The airline opened a destination near the city.', isCorrect: false },
      { text: 'They enjoyed the destination of the cooking class.', isCorrect: false },
    ],
  },
  itinerary: {
    sentences: [
      { text: 'Our travel agent sent the updated itinerary for next week’s trip.', isCorrect: true },
      { text: 'The guide printed a itinerary about hotel policies.', isCorrect: false },
      { text: 'The tourist bought an itinerary at the market.', isCorrect: false },
      { text: 'We reserved a itinerary in the restaurant.', isCorrect: false },
    ],
  },
  accommodation: {
    sentences: [
      { text: 'The hotel provided comfortable accommodation for conference guests.', isCorrect: true },
      { text: 'They designed a accommodation on waste management.', isCorrect: false },
      { text: 'We opened a accommodation for renewable energy research.', isCorrect: false },
      { text: 'The chef created a accommodation for new dishes.', isCorrect: false },
    ],
  },
  hospitality: {
    sentences: [
      { text: 'Their warm hospitality made visitors feel immediately at home.', isCorrect: true },
      { text: 'The school introduced a hospitality about recycling.', isCorrect: false },
      { text: 'She presented a hospitality on finance.', isCorrect: false },
      { text: 'The mayor hosted a hospitality about technology.', isCorrect: false },
    ],
  },
  attraction: {
    sentences: [
      { text: 'The Eiffel Tower is the city’s most famous tourist attraction.', isCorrect: true },
      { text: 'Students attended an attraction about job training.', isCorrect: false },
      { text: 'The local council built a attraction for recycling.', isCorrect: false },
      { text: 'They prepared an attraction on banking systems.', isCorrect: false },
    ],
  },

  // 🌾 Food & Agriculture
  organic: {
    sentences: [
      { text: 'Many consumers prefer organic food grown without pesticides.', isCorrect: true },
      { text: 'The chef offered a organic on energy policy.', isCorrect: false },
      { text: 'Farmers built a organic near the river.', isCorrect: false },
      { text: 'We presented a organic about urban housing.', isCorrect: false },
    ],
  },
  nutrition: {
    sentences: [
      { text: 'Good nutrition is essential for a healthy immune system.', isCorrect: true },
      { text: 'The teacher hosted a nutrition about air pollution.', isCorrect: false },
      { text: 'The mayor signed a nutrition on recycling.', isCorrect: false },
      { text: 'They attended a nutrition for transport planning.', isCorrect: false },
    ],
  },
  cultivation: {
    sentences: [
      { text: 'Rice cultivation requires plenty of sunlight and water.', isCorrect: true },
      { text: 'Scientists discussed cultivation during their urban meeting.', isCorrect: false },
      { text: 'The architect explained a cultivation about bridges.', isCorrect: false },
      { text: 'The minister gave a cultivation for digital education.', isCorrect: false },
    ],
  },
  harvest: {
    sentences: [
      { text: 'Farmers celebrated a successful harvest after months of hard work.', isCorrect: true },
      { text: 'Students attended a harvest on entrepreneurship.', isCorrect: false },
      { text: 'The company opened a harvest in the capital.', isCorrect: false },
      { text: 'Volunteers joined a harvest about solar panels.', isCorrect: false },
    ],
  },
  livestock: {
    sentences: [
      { text: 'The farm raises livestock such as cows, goats, and chickens.', isCorrect: true },
      { text: 'The chef designed a livestock for healthy menus.', isCorrect: false },
      { text: 'They attended a livestock about traffic rules.', isCorrect: false },
      { text: 'The mayor announced a livestock on mental health.', isCorrect: false },
    ],
  },

  // 🏙 Urban Development
  infrastructure: {
    sentences: [
      { text: 'The city is investing heavily in transport infrastructure.', isCorrect: true },
      { text: 'The architect introduced an infrastructure on water safety.', isCorrect: false },
      { text: 'Residents joined an infrastructure about local art.', isCorrect: false },
      { text: 'Students planned an infrastructure in biology.', isCorrect: false },
    ],
  },
  residential: {
    sentences: [
      { text: 'This residential area is quiet and close to good schools.', isCorrect: true },
      { text: 'Engineers created a residential for waste recycling.', isCorrect: false },
      { text: 'The shop offered a residential on finance.', isCorrect: false },
      { text: 'They wrote a residential about mental health.', isCorrect: false },
    ],
  },
  metropolitan: {
    sentences: [
      { text: 'Tokyo is one of the largest metropolitan regions in the world.', isCorrect: true },
      { text: 'The team organized a metropolitan on health care.', isCorrect: false },
      { text: 'We enjoyed a metropolitan during our science fair.', isCorrect: false },
      { text: 'The bank launched a metropolitan this quarter.', isCorrect: false },
    ],
  },
  congestion: {
    sentences: [
      { text: 'Traffic congestion has worsened during morning rush hours.', isCorrect: true },
      { text: 'The mayor gave a congestion on ocean safety.', isCorrect: false },
      { text: 'Citizens joined a congestion for renewable energy.', isCorrect: false },
      { text: 'Students read a congestion about economics.', isCorrect: false },
    ],
  },
  zoning: {
    sentences: [
      { text: 'The new zoning laws allow more green spaces in urban areas.', isCorrect: true },
      { text: 'The planner wrote a zoning on fitness.', isCorrect: false },
      { text: 'The class attended a zoning for agriculture.', isCorrect: false },
      { text: 'Officials announced a zoning about online learning.', isCorrect: false },
    ],
  },

  // 🎓 Education System
  curriculum: {
    sentences: [
      { text: 'The new curriculum includes coding and environmental studies.', isCorrect: true },
      { text: 'The teacher gave a curriculum on traffic control.', isCorrect: false },
      { text: 'They attended a curriculum at city hall.', isCorrect: false },
      { text: 'The manager opened a curriculum for employees.', isCorrect: false },
    ],
  },
  pedagogy: {
    sentences: [
      { text: 'Effective pedagogy helps teachers engage students in active learning.', isCorrect: true },
      { text: 'The dean presented a pedagogy for recycling.', isCorrect: false },
      { text: 'We joined a pedagogy on museum funding.', isCorrect: false },
      { text: 'The company released a pedagogy brochure.', isCorrect: false },
    ],
  },
  literacy: {
    sentences: [
      { text: 'Improving adult literacy is a major goal of this program.', isCorrect: true },
      { text: 'The mayor started a literacy on renewable energy.', isCorrect: false },
      { text: 'The author signed a literacy last night.', isCorrect: false },
      { text: 'Volunteers opened a literacy on transportation.', isCorrect: false },
    ],
  },
  vocational: {
    sentences: [
      { text: 'The college offers vocational training in carpentry and mechanics.', isCorrect: true },
      { text: 'They held a vocational about environmental protection.', isCorrect: false },
      { text: 'We wrote a vocational on creative writing.', isCorrect: false },
      { text: 'The artist painted a vocational for tourism.', isCorrect: false },
    ],
  },
  assessment: {
    sentences: [
      { text: 'Continuous assessment helps teachers track student progress.', isCorrect: true },
      { text: 'The director created an assessment on architecture.', isCorrect: false },
      { text: 'Researchers discussed assessment at the city council.', isCorrect: false },
      { text: 'Students submitted a assessment for music class.', isCorrect: false },
    ],
  },

  // ⚖️ Crime & Law
  defendant: {
    sentences: [
      { text: 'The defendant pleaded not guilty to all charges in court.', isCorrect: true },
      { text: 'The judge hired a defendant for city development.', isCorrect: false },
      { text: 'They visited a defendant about public health.', isCorrect: false },
      { text: 'Students watched a defendant on pollution.', isCorrect: false },
    ],
  },
  prosecution: {
    sentences: [
      { text: 'The prosecution presented new evidence during the trial.', isCorrect: true },
      { text: 'The team conducted a prosecution on recycling.', isCorrect: false },
      { text: 'The minister opened a prosecution about housing.', isCorrect: false },
      { text: 'The journalist attended a prosecution yesterday.', isCorrect: false },
    ],
  },
  verdict: {
    sentences: [
      { text: 'The jury reached a unanimous verdict after two days of discussion.', isCorrect: true },
      { text: 'Citizens celebrated the verdict at the park opening.', isCorrect: false },
      { text: 'The mayor signed a verdict for education.', isCorrect: false },
      { text: 'Students debated a verdict in biology class.', isCorrect: false },
    ],
  },
  justice: {
    sentences: [
      { text: 'People demand justice when laws are applied unfairly.', isCorrect: true },
      { text: 'The police opened a justice in the new hospital.', isCorrect: false },
      { text: 'Activists organized a justice about recycling habits.', isCorrect: false },
      { text: 'The minister joined a justice on business ethics.', isCorrect: false },
    ],
  },
  rehabilitation: {
    sentences: [
      { text: 'The center focuses on the rehabilitation of former prisoners.', isCorrect: true },
      { text: 'The doctor hosted a rehabilitation on technology.', isCorrect: false },
      { text: 'They attended a rehabilitation festival downtown.', isCorrect: false },
      { text: 'The nurse read a rehabilitation about road safety.', isCorrect: false },
    ],
  },

  // 🧠 Psychology & Behavior
  cognitive: {
    sentences: [
      { text: 'Reading regularly can improve your cognitive skills.', isCorrect: true },
      { text: 'The teacher offered a cognitive in chemistry.', isCorrect: false },
      { text: 'Students joined a cognitive about art.', isCorrect: false },
      { text: 'The scientist published a cognitive on marine biology.', isCorrect: false },
    ],
  },
  motivation: {
    sentences: [
      { text: 'A clear goal can increase your motivation to study.', isCorrect: true },
      { text: 'The artist displayed a motivation in the museum.', isCorrect: false },
      { text: 'The dean gave a motivation on recycling.', isCorrect: false },
      { text: 'The trainer finished a motivation about pollution.', isCorrect: false },
    ],
  },
  perception: {
    sentences: [
      { text: 'Media can strongly influence public perception of social issues.', isCorrect: true },
      { text: 'The city introduced a perception about housing.', isCorrect: false },
      { text: 'He built a perception for traffic control.', isCorrect: false },
      { text: 'We wrote a perception on nutrition.', isCorrect: false },
    ],
  },
  anxiety: {
    sentences: [
      { text: 'Breathing exercises can help reduce anxiety before exams.', isCorrect: true },
      { text: 'The doctor published a anxiety on ocean safety.', isCorrect: false },
      { text: 'The patient attended a anxiety about energy use.', isCorrect: false },
      { text: 'Nurses discussed a anxiety at lunch.', isCorrect: false },
    ],
  },
  resilience: {
    sentences: [
      { text: 'Her resilience helped her recover quickly after failure.', isCorrect: true },
      { text: 'The coach designed a resilience about architecture.', isCorrect: false },
      { text: 'The teacher held a resilience on nutrition.', isCorrect: false },
      { text: 'Students joined a resilience for environmental care.', isCorrect: false },
    ],
  },

  // 🌐 Global Issues
  humanitarian: {
    sentences: [
      { text: 'The UN sent humanitarian aid to the flood victims.', isCorrect: true },
      { text: 'The factory produced a humanitarian for recycling.', isCorrect: false },
      { text: 'They opened a humanitarian near the park.', isCorrect: false },
      { text: 'The singer performed a humanitarian at the museum.', isCorrect: false },
    ],
  },
  refugee: {
    sentences: [
      { text: 'Thousands of refugees crossed the border seeking safety.', isCorrect: true },
      { text: 'The agency built a refugee about pollution.', isCorrect: false },
      { text: 'Volunteers taught a refugee on climate change.', isCorrect: false },
      { text: 'The reporter wrote a refugee on education.', isCorrect: false },
    ],
  },
  conflict: {
    sentences: [
      { text: 'The two nations finally ended a long political conflict.', isCorrect: true },
      { text: 'The team presented a conflict about nutrition.', isCorrect: false },
      { text: 'We opened a conflict for tourism.', isCorrect: false },
      { text: 'They designed a conflict on architecture.', isCorrect: false },
    ],
  },
  famine: {
    sentences: [
      { text: 'Severe drought has led to famine in several rural areas.', isCorrect: true },
      { text: 'The scientist led a famine on renewable energy.', isCorrect: false },
      { text: 'The town held a famine about recycling.', isCorrect: false },
      { text: 'Teachers discussed a famine during class.', isCorrect: false },
    ],
  },
  pandemic: {
    sentences: [
      { text: 'The pandemic caused major changes in travel and education worldwide.', isCorrect: true },
      { text: 'Doctors hosted a pandemic about energy reform.', isCorrect: false },
      { text: 'The artist created a pandemic mural.', isCorrect: false },
      { text: 'We attended a pandemic for housing issues.', isCorrect: false },
    ],
  },

  // 🏋️ Sports & Fitness
  athletic: {
    sentences: [
      { text: 'She’s very athletic and trains every morning before work.', isCorrect: true },
      { text: 'The doctor prescribed a athletic for nutrition.', isCorrect: false },
      { text: 'The gym opened a athletic for engineers.', isCorrect: false },
      { text: 'Students read a athletic about recycling.', isCorrect: false },
    ],
  },
  endurance: {
    sentences: [
      { text: 'Marathon runners need exceptional endurance to finish the race.', isCorrect: true },
      { text: 'The teacher wrote a endurance on communication.', isCorrect: false },
      { text: 'The group joined a endurance about marketing.', isCorrect: false },
      { text: 'We hosted a endurance in art class.', isCorrect: false },
    ],
  },
  competition: {
    sentences: [
      { text: 'The school held a science competition for high-school students.', isCorrect: true },
      { text: 'The mayor started a competition on traffic safety.', isCorrect: false },
      { text: 'We watched a competition about literature.', isCorrect: false },
      { text: 'The city built a competition near the park.', isCorrect: false },
    ],
  },
  stamina: {
    sentences: [
      { text: 'Regular training helps improve your stamina over time.', isCorrect: true },
      { text: 'The chef prepared a stamina for recycling week.', isCorrect: false },
      { text: 'The journalist published a stamina on technology.', isCorrect: false },
      { text: 'They attended a stamina about housing.', isCorrect: false },
    ],
  },
  performance: {
    sentences: [
      { text: 'His performance in the match impressed everyone on the team.', isCorrect: true },
      { text: 'The mayor gave a performance on environmental law.', isCorrect: false },
      { text: 'The student delivered a performance report to HR.', isCorrect: false },
      { text: 'They attended a performance about banking.', isCorrect: false },
    ],
  },

  // 💰 Finance & Banking
  mortgage: {
    sentences: [
      { text: 'They applied for a mortgage to buy their first home.', isCorrect: true },
      { text: 'The student received a mortgage in chemistry.', isCorrect: false },
      { text: 'We attended a mortgage on art.', isCorrect: false },
      { text: 'The company opened a mortgage branch in the forest.', isCorrect: false },
    ],
  },
  credit: {
    sentences: [
      { text: 'Building good credit is important for future financial stability.', isCorrect: true },
      { text: 'The teacher explained a credit on nutrition.', isCorrect: false },
      { text: 'The mayor signed a credit about pollution.', isCorrect: false },
      { text: 'The artist held a credit last week.', isCorrect: false },
    ],
  },
  assets: {
    sentences: [
      { text: 'The company’s assets include land, vehicles, and cash.', isCorrect: true },
      { text: 'The scientist analyzed assets of plant growth.', isCorrect: false },
      { text: 'They organized an assets for recycling.', isCorrect: false },
      { text: 'The factory displayed assets in the gallery.', isCorrect: false },
    ],
  },
  budget: {
    sentences: [
      { text: 'The family prepared a monthly budget to control expenses.', isCorrect: true },
      { text: 'The group completed a budget on climate policy.', isCorrect: false },
      { text: 'The teacher hosted a budget about farming.', isCorrect: false },
      { text: 'We wrote a budget for museum hours.', isCorrect: false },
    ],
  },
  transaction: {
    sentences: [
      { text: 'The store processed your transaction successfully within seconds.', isCorrect: true },
      { text: 'The journalist discussed a transaction about transport.', isCorrect: false },
      { text: 'The engineer built a transaction for the bridge.', isCorrect: false },
      { text: 'Students joined a transaction on energy.', isCorrect: false },
    ],
  },

  // 💼 Employment & Career
  qualification: {
    sentences: [
      { text: 'A teaching qualification is required to work in public schools.', isCorrect: true },
      { text: 'The office launched a qualification about recycling.', isCorrect: false },
      { text: 'The student wrote a qualification on literature.', isCorrect: false },
      { text: 'The city opened a qualification last week.', isCorrect: false },
    ],
  },
  promotion: {
    sentences: [
      { text: 'She received a promotion after two years of excellent work.', isCorrect: true },
      { text: 'The company held a promotion about safety rules.', isCorrect: false },
      { text: 'He joined a promotion on nutrition.', isCorrect: false },
      { text: 'They attended a promotion about housing.', isCorrect: false },
    ],
  },
  resignation: {
    sentences: [
      { text: 'He handed in his resignation to pursue another opportunity.', isCorrect: true },
      { text: 'The dean organized a resignation about clean water.', isCorrect: false },
      { text: 'They presented a resignation in class.', isCorrect: false },
      { text: 'The firm hosted a resignation on climate policy.', isCorrect: false },
    ],
  },
  productivity: {
    sentences: [
      { text: 'Good time management can improve your overall productivity.', isCorrect: true },
      { text: 'The artist displayed a productivity in the exhibition.', isCorrect: false },
      { text: 'The doctor attended a productivity for public health.', isCorrect: false },
      { text: 'The trainer wrote a productivity on architecture.', isCorrect: false },
    ],
  },
  colleague: {
    sentences: [
      { text: 'My colleague helped me prepare for the company presentation.', isCorrect: true },
      { text: 'The mayor invited a colleague to open the factory.', isCorrect: false },
      { text: 'We saw a colleague exhibition last week.', isCorrect: false },
      { text: 'The reporter wrote about a colleague on marine life.', isCorrect: false },
    ],
  },
};

