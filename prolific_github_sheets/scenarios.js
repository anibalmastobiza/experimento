/**
 * Scenario Bank for Moral Intuition Topology Study
 *
 * Each scenario is a moral vignette mapped to a 5-dimensional space:
 *
 *   d1 — Agency type        (0 = natural event → 1 = deliberate human action)
 *   d2 — Causal directness  (0 = highly mediated → 1 = physical/proximate)
 *   d3 — Number affected    (0 = 1 person → 1 = 1,000 people; log-scaled)
 *   d4 — Intention clarity  (0 = pure side-effect → 1 = explicit goal)
 *   d5 — Relational prox.   (0 = stranger → 1 = intimate relationship)
 *
 * Scenarios cover corners, faces, and interior regions of the 5-D hypercube.
 * Text is 60–100 words. The implicit question is always:
 * "Is this morally permissible?"
 */
window.SCENARIO_BANK = [
  // --- Corner/extreme scenarios ---
  {
    id: "S001",
    text: "A severe earthquake collapses a remote bridge, cutting off a village of 800 people from medical supplies. No one caused the earthquake, and the destruction is an entirely natural consequence. Relief organizations learn about the situation days later. The villagers, all strangers to the aid workers, must wait for infrastructure to be rebuilt. A government official decides not to divert helicopters from another region, knowing the villagers will suffer longer delays.",
    dimensions: { d1: 0.05, d2: 0.10, d3: 0.90, d4: 0.10, d5: 0.05 }
  },
  {
    id: "S002",
    text: "A surgeon deliberately withholds a experimental treatment from a single patient — her own daughter — because the treatment has a 40% chance of fatal complications. She has the explicit goal of protecting her child, even though the disease will progress without intervention. The daughter is unaware of the available treatment. The surgeon acts alone, physically keeping the medication locked away.",
    dimensions: { d1: 0.95, d2: 0.90, d3: 0.00, d4: 0.95, d5: 1.00 }
  },
  {
    id: "S003",
    text: "A factory manager knowingly approves the disposal of chemical waste into a river, fully intending to cut costs. The contamination gradually spreads through the water supply over several months, eventually affecting over 500 strangers in downstream communities. The causal chain is long and indirect — the chemicals pass through filtration systems that partially fail. The manager never meets or sees any of the affected people.",
    dimensions: { d1: 0.90, d2: 0.20, d3: 0.80, d4: 0.90, d5: 0.05 }
  },
  {
    id: "S004",
    text: "During a flash flood, a falling tree strikes and injures a hiker. The hiker's companion — a complete stranger who happened to be on the same trail — tries to move the tree but accidentally worsens the injury. The companion had no intention of causing harm; the additional damage is purely a side-effect of the rescue attempt. Only one person is affected.",
    dimensions: { d1: 0.10, d2: 0.85, d3: 0.00, d4: 0.05, d5: 0.10 }
  },
  {
    id: "S005",
    text: "A military commander orders an airstrike on a weapons depot, knowing with certainty that it will kill approximately 200 enemy combatants. The strike is carried out by remote drone — the commander is thousands of miles away. The combatants are strangers. The commander's explicit intention is to destroy the depot and eliminate the threat. The causal chain involves multiple intermediary systems and personnel.",
    dimensions: { d1: 0.95, d2: 0.30, d3: 0.70, d4: 0.95, d5: 0.00 }
  },
  {
    id: "S006",
    text: "A mother physically pulls her toddler away from a playground structure, dislocating the child's shoulder in the process. She acted on pure instinct when she saw a heavy beam about to fall. The injury to her child was an unintended side-effect of the rescue. Only her child was involved, and the contact was direct and immediate.",
    dimensions: { d1: 0.80, d2: 0.95, d3: 0.00, d4: 0.05, d5: 1.00 }
  },
  // --- Face scenarios (4 dimensions extreme, 1 intermediate) ---
  {
    id: "S007",
    text: "A pharmaceutical executive decides to raise the price of a critical medication by 500%, knowing this will make it unaffordable for approximately 300 patients. The executive's explicit goal is to maximize shareholder returns. The effect is mediated through insurance systems and pharmacy networks — the executive never interacts with any patient. The patients are strangers. The price change takes effect gradually over three months.",
    dimensions: { d1: 0.90, d2: 0.15, d3: 0.75, d4: 0.90, d5: 0.05 }
  },
  {
    id: "S008",
    text: "A teacher discovers that a colleague — also a close personal friend — has been falsifying student grades. The teacher reports the friend to the administration, knowing this will end their career. The teacher's intention is to protect the 30 affected students, not to harm the friend. The report is filed through institutional channels — an indirect, bureaucratic process. The harm to the friend is a foreseen but unintended consequence.",
    dimensions: { d1: 0.85, d2: 0.20, d3: 0.45, d4: 0.50, d5: 0.85 }
  },
  {
    id: "S009",
    text: "A volunteer firefighter enters a burning building and physically carries out an unconscious stranger. In the process, the firefighter accidentally drops the person while climbing through a window, breaking their leg. The firefighter had no intention of causing the injury — it was a pure side-effect of the rescue. The physical contact was direct and immediate. Only one person was affected.",
    dimensions: { d1: 0.70, d2: 0.90, d3: 0.00, d4: 0.05, d5: 0.05 }
  },
  {
    id: "S010",
    text: "A hurricane destroys a coastal hospital's power supply, and the backup generators fail due to poor maintenance. The failure is partly natural, partly due to institutional neglect. Over 100 patients on life support are affected. No single person intended this outcome — it emerged from a combination of natural disaster and systemic under-investment. The patients are strangers to the maintenance staff.",
    dimensions: { d1: 0.25, d2: 0.50, d3: 0.65, d4: 0.10, d5: 0.05 }
  },
  // --- Interior scenarios (varied, moderate coordinates) ---
  {
    id: "S011",
    text: "A city planner approves a new highway route that will demolish 15 homes in a low-income neighborhood. The planner knows the residents personally — several are acquaintances from community meetings. The highway will benefit tens of thousands of commuters. The planner's primary intention is improving traffic flow; the displacement is a known but unwelcome side-effect. The demolitions are carried out by contractors months later.",
    dimensions: { d1: 0.75, d2: 0.25, d3: 0.40, d4: 0.35, d5: 0.40 }
  },
  {
    id: "S012",
    text: "A nurse administers a pain medication to a terminally ill patient — her elderly father — knowing the dose will likely hasten his death by a few hours. The father has requested this. The nurse's intention is to relieve suffering, not to cause death, though she foresees both outcomes. The administration is direct and physical. Only one person is affected.",
    dimensions: { d1: 0.85, d2: 0.90, d3: 0.00, d4: 0.50, d5: 0.95 }
  },
  {
    id: "S013",
    text: "A software engineer discovers a security flaw in a banking application used by 10,000 customers. Rather than reporting it through proper channels, she publicly discloses the vulnerability on social media, knowing the bank will be forced to fix it quickly but also that criminals might exploit it in the interim. Her goal is accountability, though some customers — all strangers — may suffer financial losses.",
    dimensions: { d1: 0.80, d2: 0.30, d3: 0.60, d4: 0.70, d5: 0.05 }
  },
  {
    id: "S014",
    text: "A farmer's irrigation system accidentally diverts water from a neighboring property during a drought, causing the neighbor's crops to fail. The farmer and the neighbor are old friends who have shared equipment for years. The farmer did not intend the diversion — it resulted from a mechanical malfunction. Only the neighbor's farm is affected. The cause is moderately direct: the water physically flowed from one property to the other.",
    dimensions: { d1: 0.30, d2: 0.60, d3: 0.00, d4: 0.10, d5: 0.75 }
  },
  {
    id: "S015",
    text: "A school principal cancels the annual field trip for 200 students after learning that the bus company has a poor safety record. The students are disappointed and some parents are angry. The principal's explicit goal is to prevent potential harm, even though no accident has occurred or was certain to occur. The decision is administrative — no physical action is involved. The principal does not know most of the families personally.",
    dimensions: { d1: 0.70, d2: 0.10, d3: 0.70, d4: 0.80, d5: 0.15 }
  },
  {
    id: "S016",
    text: "A researcher omits unfavorable data from a clinical trial report, making a new drug appear safer than it is. The drug goes on to be prescribed to approximately 50 patients, three of whom experience serious side effects. The researcher's primary intention was career advancement; the patient harm was a foreseen but secondary consideration. The causal chain is long and indirect. The patients are strangers.",
    dimensions: { d1: 0.85, d2: 0.15, d3: 0.50, d4: 0.60, d5: 0.05 }
  },
  {
    id: "S017",
    text: "A lifeguard at a crowded beach must choose between swimming toward a drowning child she recognizes as her nephew or toward two drowning strangers who are farther away. She swims toward her nephew, saving him. The two strangers are rescued by others who arrive slightly later, but one suffers permanent brain damage from oxygen deprivation. The lifeguard's physical intervention was direct and immediate.",
    dimensions: { d1: 0.90, d2: 0.95, d3: 0.30, d4: 0.40, d5: 0.80 }
  },
  {
    id: "S018",
    text: "A landlord raises rent by 30% in a gentrifying neighborhood, knowing that approximately 20 low-income tenants — all of whom she has known for years — will be unable to afford their homes. Her stated goal is to cover rising property taxes, though the increase exceeds what is strictly necessary. The displacement occurs gradually over several months as leases expire.",
    dimensions: { d1: 0.80, d2: 0.20, d3: 0.40, d4: 0.55, d5: 0.60 }
  },
  {
    id: "S019",
    text: "An autonomous vehicle's algorithm swerves to avoid a group of five pedestrians, directing the car into a concrete barrier. The single passenger — a stranger to the pedestrians — suffers serious injuries. The algorithm was designed by engineers months earlier; no human made this specific decision in real time. The causal chain involves software, sensors, and mechanical systems. The intention was programmed as a general rule, not applied to this case specifically.",
    dimensions: { d1: 0.40, d2: 0.50, d3: 0.50, d4: 0.30, d5: 0.05 }
  },
  {
    id: "S020",
    text: "A brother donates a kidney to his sister, knowing there is a 5% chance of serious complications for himself and that his own children may need him healthy in the future. His explicit intention is to save his sister's life. The surgery is a direct physical intervention. Only two people are directly affected — himself and his sister. The decision was made after extensive deliberation.",
    dimensions: { d1: 0.90, d2: 0.90, d3: 0.00, d4: 0.90, d5: 0.90 }
  },
  {
    id: "S021",
    text: "A wildlife sanctuary manager decides to cull 50 deer to prevent overgrazing that threatens the broader ecosystem supporting hundreds of species. The culling is carried out by hired hunters who shoot the animals directly. The manager's intention is ecosystem preservation; the killing of individual animals is an accepted means. The deer are wild animals with no personal relationship to the manager.",
    dimensions: { d1: 0.85, d2: 0.70, d3: 0.50, d4: 0.75, d5: 0.00 }
  },
  {
    id: "S022",
    text: "A journalist publishes an investigation revealing that a local politician — who is also her uncle — has been embezzling public funds affecting services for 5,000 residents. She publishes knowing it will destroy her uncle's career and fracture her family. Her primary goal is public accountability. The harm to her uncle is mediated through public opinion, legal proceedings, and institutional consequences.",
    dimensions: { d1: 0.85, d2: 0.20, d3: 0.85, d4: 0.80, d5: 0.80 }
  },
  {
    id: "S023",
    text: "A therapist breaks patient confidentiality to warn a specific individual that her patient has expressed detailed plans to harm them. The patient — whom the therapist has treated for two years — feels deeply betrayed. The warning is delivered through a phone call, not face-to-face. Only two people are directly affected. The therapist's intention is to prevent imminent physical harm.",
    dimensions: { d1: 0.80, d2: 0.40, d3: 0.00, d4: 0.85, d5: 0.55 }
  },
  {
    id: "S024",
    text: "A food bank director distributes expired but still safe canned goods to 100 families during a severe shortage, without informing them about the expiration dates. The families are strangers to the director. Her intention is to prevent hunger; withholding the expiration information is a deliberate choice to avoid panic. The distribution is indirect — volunteers hand out the food at multiple sites.",
    dimensions: { d1: 0.75, d2: 0.25, d3: 0.65, d4: 0.65, d5: 0.05 }
  },
  {
    id: "S025",
    text: "A teenager discovers that her best friend has been shoplifting regularly. She anonymously reports the friend to store security, resulting in the friend's arrest. The teenager's intention is to stop the behavior before it escalates, though she knows the arrest will be traumatic. The report is indirect — through an anonymous tip line. Only one person is directly affected by the consequences.",
    dimensions: { d1: 0.70, d2: 0.15, d3: 0.00, d4: 0.60, d5: 0.90 }
  },
  {
    id: "S026",
    text: "A dam built decades ago by an unknown engineering firm fails during heavy rainfall, flooding a valley and displacing 400 people. The failure is caused by a combination of natural water pressure and degraded materials — no single person's action triggered it. The displaced people are scattered across several towns. No one intended this outcome; it emerged from the interaction of natural forces and aging infrastructure.",
    dimensions: { d1: 0.15, d2: 0.45, d3: 0.80, d4: 0.05, d5: 0.05 }
  },
  {
    id: "S027",
    text: "A doctor in a field hospital during a crisis must allocate the last three doses of a life-saving antidote. Ten patients need it, including the doctor's spouse. The doctor gives one dose to the spouse and distributes the remaining two based on medical priority. The administration is direct and physical. The doctor's intention is openly mixed: save the spouse and maximize lives. Seven patients — mostly strangers — do not receive the antidote.",
    dimensions: { d1: 0.90, d2: 0.85, d3: 0.30, d4: 0.70, d5: 0.75 }
  },
  {
    id: "S028",
    text: "An algorithm used by a hiring platform systematically disadvantages applicants from certain postal codes, affecting roughly 2,000 job seekers per month. The engineers who built the system did not intend this outcome — the bias emerged from training data. The effect is entirely mediated through software. No single person decided to discriminate. The affected job seekers are strangers to everyone involved in building the system.",
    dimensions: { d1: 0.20, d2: 0.10, d3: 0.95, d4: 0.05, d5: 0.00 }
  },
  {
    id: "S029",
    text: "A coach pushes a young athlete — his own son — through an extremely demanding training regimen, knowing it risks long-term joint damage. The son trusts his father's judgment and does not question the intensity. The coach's explicit goal is to develop his son's talent for a professional career. The physical training is hands-on and direct. Only one person bears the physical risk.",
    dimensions: { d1: 0.85, d2: 0.85, d3: 0.00, d4: 0.80, d5: 0.95 }
  },
  {
    id: "S030",
    text: "A mayor diverts emergency funds originally allocated for flood-damaged homes to instead build a vaccination center, anticipating a disease outbreak that may or may not occur. Approximately 60 flood-affected families — strangers to the mayor — lose their immediate assistance. The mayor's intention is to prevent a larger future crisis. The effect is indirect, flowing through bureaucratic reallocation channels.",
    dimensions: { d1: 0.80, d2: 0.15, d3: 0.55, d4: 0.70, d5: 0.10 }
  },
  {
    id: "S031",
    text: "A group of hikers encounters a stranger trapped under a boulder. One hiker suggests amputating the trapped person's leg with a pocket knife to free them before a predicted flash flood arrives in twenty minutes. The trapped stranger consents. The hiker performs the amputation — a direct, physical, intentional act on a single person with no prior relationship to the rescuer.",
    dimensions: { d1: 0.95, d2: 1.00, d3: 0.00, d4: 0.90, d5: 0.05 }
  },
  {
    id: "S032",
    text: "A social worker discovers that a family she has been supporting for months — and has grown close to — is housing an undocumented immigrant. Reporting this to authorities, as legally required, would result in the immigrant's deportation and the family's loss of housing assistance. She chooses not to report, affecting only the people in the household. Her intention is to preserve the family's stability.",
    dimensions: { d1: 0.70, d2: 0.10, d3: 0.00, d4: 0.60, d5: 0.70 }
  },
  {
    id: "S033",
    text: "A wildfire, caused by a lightning strike, threatens a town of 3,000 people. A forest ranger decides to set a controlled backfire that destroys 12 unoccupied homes to create a firebreak. The ranger's action is deliberate but the original threat is natural. The destruction is relatively direct — the ranger physically ignites the backfire. The homeowners are acquaintances from the small community.",
    dimensions: { d1: 0.60, d2: 0.70, d3: 0.35, d4: 0.75, d5: 0.35 }
  },
  {
    id: "S034",
    text: "A university professor assigns a group project knowing that one student — her academic advisee, with whom she has a mentoring relationship — has severe social anxiety and will suffer significant distress. The professor's primary intention is pedagogical; the student's distress is a foreseen side-effect. The causal link is moderately direct: the assignment directly creates the stressful situation. About 25 students are in the class.",
    dimensions: { d1: 0.75, d2: 0.55, d3: 0.40, d4: 0.30, d5: 0.55 }
  },
  {
    id: "S035",
    text: "An elderly woman with dementia wanders into traffic. A passing stranger tackles her to the ground to prevent her from being hit by a car, breaking her hip in the process. The stranger acted on impulse with no plan or deliberation. The physical contact was completely direct and immediate. Only one person was harmed. The stranger had no prior relationship with the woman.",
    dimensions: { d1: 0.60, d2: 1.00, d3: 0.00, d4: 0.10, d5: 0.05 }
  }
];
