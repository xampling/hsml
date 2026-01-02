export const sampleHsml = `# HSML demo scene

House { layout:row gap:0.4 }

House/LivingRoom: "Living" { w:5 d:4 h:2.8 open:[ door(N,1.4,0.9,2.1), window(E,0.8,1.6,1.2,0.9) ] }
House/Kitchen: "Kitchen" { w:3.2 d:3 h:2.8 open:[ door(W,1.0,0.9,2.1) ] }

House/LivingRoom/Table: "Dining" { w:1.6 d:0.9 h:0.75 basis:1.6 }
House/LivingRoom/Sofa: { w:2.2 d:0.9 h:0.8 grow:1 }
House/Kitchen/Island: { w:1.2 d:1 h:0.9 }

Room { t:0.12 }`;
