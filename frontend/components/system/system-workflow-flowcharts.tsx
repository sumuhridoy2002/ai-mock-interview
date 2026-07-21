"use client";

import {
  Arrow,
  Diamond,
  EdgeLabel,
  Line,
  Path,
  PillNode,
  ProcNode,
  useDiagramColors,
} from "@/components/system/system-methodology-diagram";

/* Flowchart-style SVG diagrams for the How It Works workflow tabs.
   Same visual language as the end-to-end journey diagram. */

export function ArchitectureFlowchart() {
  const C = useDiagramColors();
  const cx = 340;

  return (
    <svg viewBox="0 0 680 520" className="w-full h-auto block" preserveAspectRatio="xMidYMid meet" aria-label="Implementation architecture flowchart">
      <defs>
        <Arrow id="a" fill={C.line} />
        <Arrow id="aws" fill={C.wsLine} />
        <Arrow id="adb" fill={C.noteLine} />
      </defs>

      <Line x1={cx} y1={56} x2={cx} y2={78} />
      <EdgeLabel x={cx + 6} y={71} text="REST · Sanctum" />
      <Line x1={228} y1={104} x2={198} y2={104} color={C.wsLine} mark="url(#aws)" />
      <EdgeLabel x={213} y={97} text="broadcast" anchor="middle" />
      <Path d="M 119,78 L 119,38 L 251,38" color={C.wsLine} mark="url(#aws)" dash />
      <EdgeLabel x={125} y={62} text="live events" />
      <Line x1={452} y1={104} x2={484} y2={104} color={C.noteLine} mark="url(#adb)" />
      <EdgeLabel x={468} y={97} text="CRUD" anchor="middle" />
      <Line x1={cx} y1={130} x2={cx} y2={158} />
      <EdgeLabel x={cx + 6} y={148} text="dispatch" />
      <Line x1={cx} y1={210} x2={cx} y2={238} />
      <EdgeLabel x={cx + 6} y={228} text="HTTP jobs" />
      <Path d="M 250,290 L 121,328" mark="url(#a)" />
      <Path d={`M ${cx},290 L ${cx},328`} mark="url(#a)" />
      <Path d="M 430,290 L 559,328" mark="url(#a)" />
      <EdgeLabel x={168} y={312} text="LLM" anchor="end" />
      <EdgeLabel x={cx + 6} y={312} text="STT" />
      <EdgeLabel x={512} y={312} text="vision" />
      <Line x1={cx} y1={382} x2={cx} y2={418} color={C.noteLine} mark="url(#adb)" dash />
      <EdgeLabel x={cx + 6} y={404} text="results · media" />

      <PillNode x={cx - 85} y={20} w={170} label="Browser" sub="Next.js 16 client" />
      <ProcNode x={cx - 110} y={78} w={220} label="Laravel API" sub="Auth · business rules · uploads" />
      <ProcNode x={44} y={78} w={152} fill={C.wsFill} stroke={C.wsStroke} label="Reverb WS" sub="Pusher protocol" lc={C.wsText} sc={C.wsSub} />
      <ProcNode x={484} y={78} w={152} fill={C.dbFill} stroke={C.dbStroke} label="MySQL · Redis" sub="Data · cache · queues" lc={C.dbText} sc={C.dbSub} />
      <ProcNode x={cx - 110} y={158} w={220} label="Queue Worker" sub="high · default · low priorities" />
      <ProcNode x={cx - 110} y={238} w={220} fill={C.aiFill} stroke={C.aiStroke} label="FastAPI AI Service" sub="Orchestration · PDF reports" lc={C.aiText} sc={C.aiSub} />
      <ProcNode x={44} y={328} w={155} fill={C.aiFill} stroke={C.aiStroke} label="Ollama Llama 3" sub="Questions · scoring" lc={C.aiText} sc={C.aiSub} />
      <ProcNode x={cx - 78} y={328} w={155} fill={C.aiFill} stroke={C.aiStroke} label="Whisper" sub="Speech → text" lc={C.aiText} sc={C.aiSub} />
      <ProcNode x={480} y={328} w={165} fill={C.aiFill} stroke={C.aiStroke} label="Vision Pipeline" sub="Emotion · gaze · prosody" lc={C.aiText} sc={C.aiSub} />
      <ProcNode x={cx - 100} y={418} w={200} h={48} fill={C.noteFill} stroke={C.noteStroke} label="File Storage" sub="Media clips · PDF reports" lc={C.noteText} sc={C.noteSub} />
    </svg>
  );
}

export function AuthResumeFlowchart() {
  const C = useDiagramColors();
  const cx = 340;

  return (
    <svg viewBox="0 0 680 620" className="w-full h-auto block" preserveAspectRatio="xMidYMid meet" aria-label="Authentication and resume management flowchart">
      <defs>
        <Arrow id="a" fill={C.line} />
      </defs>

      <Line x1={cx} y1={56} x2={cx} y2={78} />
      <Line x1={cx} y1={130} x2={cx} y2={152} />
      <EdgeLabel x={cx + 6} y={146} text="issue token" />
      <Line x1={cx} y1={204} x2={cx} y2={228} />
      <Path d={`M ${cx - 85},273 L 120,273 L 120,328`} mark="url(#a)" />
      <Path d={`M ${cx + 85},273 L 560,273 L 560,506`} />
      <EdgeLabel x={190} y={266} text="No — upload first" anchor="middle" />
      <EdgeLabel x={490} y={266} text="Yes" anchor="middle" />
      <Line x1={120} y1={380} x2={120} y2={408} />
      <EdgeLabel x={126} y={399} text="queue: low" />
      <Path d={`M 120,460 L 120,506 L ${cx},506`} />
      <Path d={`M 560,506 L ${cx},506`} />
      <circle cx={cx} cy={506} r={3} fill={C.line} />
      <Line x1={cx} y1={506} x2={cx} y2={528} />

      <PillNode x={cx - 85} y={20} w={170} label="Start" sub="Open app" />
      <ProcNode x={cx - 100} y={78} w={200} label="Register · Login" sub="/register · /login validated" />
      <ProcNode x={cx - 100} y={152} w={200} label="Sanctum Session" sub="Bearer token on every API call" />
      <Diamond cx={cx} cy={273} hw={86} hh={45} label="Resume" label2="ready?" />
      <ProcNode x={44} y={328} w={152} label="Upload Resume" sub="PDF/DOCX validated · stored" />
      <ProcNode x={44} y={408} w={152} fill={C.aiFill} stroke={C.aiStroke} label="Parse CV Job" sub="Skills · education · experience" lc={C.aiText} sc={C.aiSub} />
      <PillNode x={cx - 95} y={528} w={190} h={38} label="Profile Ready" sub="Personalized interviews" />
    </svg>
  );
}

export function AiInterviewFlowchart() {
  const C = useDiagramColors();
  const cx = 340;

  return (
    <svg viewBox="0 0 680 640" className="w-full h-auto block" preserveAspectRatio="xMidYMid meet" aria-label="AI interview processing flowchart">
      <defs>
        <Arrow id="a" fill={C.line} />
        <Arrow id="am" fill={C.memoryLine} />
      </defs>

      <Line x1={cx} y1={56} x2={cx} y2={78} />
      <Line x1={cx} y1={130} x2={cx} y2={152} />
      <Line x1={cx} y1={204} x2={cx} y2={226} />
      <EdgeLabel x={cx + 6} y={220} text="queue: high" />
      <Line x1={cx} y1={278} x2={cx} y2={300} />
      <EdgeLabel x={cx + 6} y={294} text="WS push" />
      <Line x1={cx} y1={352} x2={cx} y2={374} />
      <Line x1={cx} y1={426} x2={cx} y2={450} />
      <Path d={`M ${cx + 86},495 L 590,495 L 590,178 L 452,178`} color={C.memoryLine} mark="url(#am)" dash />
      <EdgeLabel x={584} y={340} text="adapt · skip mastered" anchor="end" />
      <EdgeLabel x={470} y={488} text="Yes" anchor="middle" />
      <Line x1={cx} y1={540} x2={cx} y2={562} />
      <EdgeLabel x={cx + 6} y={556} text="No — finish" />

      <PillNode x={cx - 85} y={20} w={170} label="Session Start" sub="Interview UUID" />
      <ProcNode x={cx - 100} y={78} w={200} label="Interview Setup" sub="CV · JD · level · type" />
      <ProcNode x={cx - 110} y={152} w={220} fill={C.aiFill} stroke={C.aiStroke} label="Generate Question" sub="Ollama · memory-aware context" lc={C.aiText} sc={C.aiSub} />
      <ProcNode x={cx - 100} y={226} w={200} fill={C.wsFill} stroke={C.wsStroke} label="Deliver via Reverb" sub="Real-time push to live room" lc={C.wsText} sc={C.wsSub} />
      <ProcNode x={cx - 100} y={300} w={200} label="Candidate Answers" sub="Cam/mic · speech · snapshots" />
      <ProcNode x={cx - 100} y={374} w={200} label="Save Answer" sub="Transcript · timing · media" />
      <Diamond cx={cx} cy={495} hw={86} hh={45} label="More" label2="questions?" />
      <PillNode x={cx - 100} y={562} w={200} h={38} label="Evaluation & Report" sub="queue: low scoring" />
    </svg>
  );
}

export function SpeechEvaluationFlowchart() {
  const C = useDiagramColors();
  const cx = 340;

  return (
    <svg viewBox="0 0 680 580" className="w-full h-auto block" preserveAspectRatio="xMidYMid meet" aria-label="Speech processing and evaluation flowchart">
      <defs>
        <Arrow id="a" fill={C.line} />
        <Arrow id="am" fill={C.memoryLine} />
      </defs>

      <Line x1={cx} y1={56} x2={cx} y2={78} />
      <Line x1={cx} y1={130} x2={cx} y2={152} />
      <EdgeLabel x={cx + 6} y={146} text="audio clip" />
      <Path d={`M ${cx - 60},204 L 150,244`} mark="url(#a)" />
      <Path d={`M ${cx + 60},204 L 530,244`} mark="url(#a)" />
      <EdgeLabel x={216} y={228} text="content" anchor="end" />
      <EdgeLabel x={464} y={228} text="delivery" />
      <Path d={`M 150,296 L 150,336 L ${cx - 2},336`} />
      <Path d={`M 530,296 L 530,336 L ${cx + 2},336`} />
      <circle cx={cx} cy={336} r={3} fill={C.line} />
      <Line x1={cx} y1={336} x2={cx} y2={358} />
      <Line x1={cx} y1={410} x2={cx} y2={432} color={C.memoryLine} mark="url(#am)" />
      <EdgeLabel x={cx + 6} y={426} text="mastery update" />
      <Line x1={cx} y1={484} x2={cx} y2={506} />

      <PillNode x={cx - 90} y={20} w={180} label="Answer Recorded" sub="Per-question A/V" />
      <ProcNode x={cx - 100} y={78} w={200} label="Whisper Transcript" sub="Speech → normalized text" />
      <ProcNode x={44} y={244} w={212} fill={C.aiFill} stroke={C.aiStroke} label="Evaluate Content" sub="Ollama: relevance · accuracy · clarity" lc={C.aiText} sc={C.aiSub} />
      <ProcNode x={424} y={244} w={212} fill={C.aiFill} stroke={C.aiStroke} label="Analyze Behavior" sub="Vision: emotion · gaze · confidence" lc={C.aiText} sc={C.aiSub} />
      <ProcNode x={cx - 100} y={152} w={200} fill={C.aiFill} stroke={C.aiStroke} label="FastAPI Pipeline" sub="Runs content + behavior in parallel" lc={C.aiText} sc={C.aiSub} />
      <ProcNode x={cx - 100} y={358} w={200} label="Combine Scores" sub="Weighted rubric + coaching notes" />
      <ProcNode x={cx - 100} y={432} w={200} fill={C.memoryFill} stroke={C.memoryStroke} label="Store Feedback" sub="Scores · mastery · notes" lc={C.memoryText} sc={C.memorySub} />
      <PillNode x={cx - 90} y={506} w={180} h={38} label="Report Ready" sub="Charts · STAR · PDF" />
    </svg>
  );
}
