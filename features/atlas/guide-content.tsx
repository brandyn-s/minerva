export default function GuideContent() {
  return <article className="guide-content">
    <p className="instrument-label">A field guide to Minerva</p>
    <h2>A map for thinking things through.</h2>
    <p className="guide-intro">Keep alternatives in view, follow where ideas came from, and develop the directions that interest you. You decide what is useful and what deserves a real-world test.</p>

    <section className="guide-start" aria-labelledby="guide-start-title">
      <h3 id="guide-start-title">Start with one small journey</h3>
      <ol>
        <li><strong>Read the question.</strong> Find “What to do with a dead shopping mall” in Thoughts or Read as text. The brief gives the proposals their shared context.</li>
        <li><strong>Follow two sources.</strong> Open “Repair, then stay for supper.” Its parents are “A food hall” and “A shared tool library.” Inspect the contributions or follow Parents in the connections panel.</li>
        <li><strong>Notice the change.</strong> Shared tables and practical learning become a hosted repair-and-meal session. That is a new proposal, with open questions about staffing, food safety, and demand.</li>
      </ol>
      <p>The mall study is a prepared, editable example. Its proposals have not been validated by a site survey or market research. If you have replaced the example, follow the same journey with an idea and its sources.</p>
    </section>

    <div className="guide-chapters">
      <details>
        <summary>Read cards and connections</summary>
        <div>
          <p>A card gives an idea a title and a short summary. Open its details to read the full text, contributions, and relationships. Look for what was inherited, what changed, what is new, and what remains unknown.</p>
          <dl>
            <dt>Inheritance</dt><dd>A source idea contributed to a later idea. A branch can develop one source; a recombination can bring several sources together. Follow the connection to inspect the contribution.</dd>
            <dt>Shared brief</dt><dd>Ideas address the same question. Sharing a brief does not make them parents of one another.</dd>
            <dt>Association</dt><dd>A potentially useful connection between ideas. It does not establish that one was derived from the other.</dd>
          </dl>
          <p>Card position is an arrangement, not a score or proof of ancestry. Turn on <strong>Menu → Relationship labels</strong> when you want more detail on the lines.</p>
          <p><strong>Selected</strong> means an idea is in your current working set. Where a decision such as <strong>kept</strong> appears in a reading or download, it records a choice to retain an idea—not proof that it works.</p>
        </div>
      </details>
      <details>
        <summary>Find your way around</summary>
        <div>
          <p>Use <strong>Thoughts</strong> to browse or find a card, and <strong>Read as text</strong> to read the same material without navigating the map. Focus brings an idea into view; Inspect opens its details.</p>
          <p>Select cards with their selection controls to build a working set. The selection dock shows the available actions. <strong>Clear selection</strong> clears that working set; it does not delete ideas.</p>
          <p>Drag a card by its handle to arrange it. With the handle focused, arrow keys move the card. With the atlas itself focused, press <kbd>0</kbd> to fit the view, <kbd>+</kbd> to zoom in, or <kbd>−</kbd> to zoom out.</p>
          <p>Follow Parents, Children, Associations, or Shared brief in the connections panel. A focused connection helps you trace one relationship through a busy map.</p>
          <p>Close this guide to return to the atlas. <kbd>Esc</kbd> also closes the panel and returns keyboard focus to Guide. Opening the guide does not change your cards or selection.</p>
        </div>
      </details>
      <details>
        <summary>Choose a perspective</summary>
        <div>
          <dl>
            <dt>Lineage · read the contributions</dt><dd>Detailed cards and their connections help you understand where a proposal came from.</dd>
            <dt>Evolution · follow the branches</dt><dd>Compact nodes make the branching structure easier to scan as the atlas grows. Open a node to read the underlying idea.</dd>
            <dt>Constellation · look for themes</dt><dd>Minerva groups the same ideas into proposed themes. Opening this view can request an AI grouping. Use Regroup when you want to reconsider the arrangement.</dd>
          </dl>
          <p>These are perspectives on the same ideas. A theme is a model interpretation, not an established finding. Similar wording can hide different mechanisms; nearby ideas need not share an origin.</p>
        </div>
      </details>
      <details>
        <summary>Develop ideas with the creative tools</summary>
        <div>
          <dl>
            <dt>Wander · explore from one idea</dt><dd>Select one card. Wander requests suggested next steps; choosing a step develops a new direction. Explore freely generates several directions instead. Read each result and its source contribution before continuing.</dd>
            <dt>Compare · read ideas together</dt><dd>Select the ideas you want to inspect side by side. Comparison helps you see differences before deciding what to develop or combine.</dd>
            <dt>Weave · combine contributions</dt><dd>Select at least two cards. Weave generates a proposal from the selected sources and connects it to its parents. Inspect what each source contributed and what the combination changes.</dd>
            <dt>Expedition · follow a goal</dt><dd>Select one starting card, state a goal, and choose a step budget. Each step develops a new card from the previous direction. The budget limits the number of steps; it does not guarantee success. Use Stop to interrupt a running expedition.</dd>
          </dl>
          <p>For an expedition, try a concrete goal such as “Develop a small repair-and-supper pilot that can run for one evening.” Afterwards, <strong>What this expedition suggests</strong> offers an interpretation and next experiments.</p>
          <p>Wander, Weave, and Expedition use AI. They can take time or fail. Read the status and use the offered retry control if needed. You can inspect the ideas already on the atlas while work continues.</p>
        </div>
      </details>
      <details>
        <summary>Talk with Minerva</summary>
        <div>
          <p>Open the Minerva cameo to discuss the atlas. Typed Talk receives the current canvas and its relationships. Selected cards tell it where your attention is; they do not limit which cards it can see.</p>
          <p>Talk can explain, question, and suggest. It cannot create or change cards. Use the atlas tools to develop a suggestion into a card.</p>
          <p>Try asking:</p>
          <ul>
            <li>“What changed between these ideas?”</li>
            <li>“Which assumptions would we need to test?”</li>
            <li>“What does this combination keep from each parent?”</li>
          </ul>
          <p>Type in the composer and press <kbd>Enter</kbd> to send; <kbd>Shift</kbd> + <kbd>Enter</kbd> adds a new line. The microphone control offers a spoken conversation when microphone access is available.</p>
        </div>
      </details>
      <details>
        <summary>Judge what you discover</summary>
        <div>
          <p>Keep the distinction between a prepared example, a generated proposal, a model interpretation, your own decision, and external evidence. A confident explanation is still something to examine.</p>
          <p>“Goal appears reached” is the model’s self-report. A new theme or a larger collection of cards does not by itself mean you have found a better answer.</p>
          <p>Before carrying a direction forward, ask:</p>
          <ol>
            <li>What actually changed in how this idea would work?</li>
            <li>Which important assumption is still untested?</li>
            <li>What small experiment could help us decide?</li>
          </ol>
          <p>For repair-and-supper, the next useful step might be a conversation with repair volunteers and a food operator about a single trial evening. The atlas helps you formulate that test; it does not supply its outcome.</p>
        </div>
      </details>
      <details>
        <summary>Save and take your work with you</summary>
        <div>
          <p>The demo saves your atlas in this browser. It is not an account with cross-device sync. Clearing browser data can remove that local copy.</p>
          <dl>
            <dt>Menu → Export atlas</dt><dd>Download a JSON backup that Minerva can import again.</dd>
            <dt>Menu → Import atlas</dt><dd>Choose an exported atlas, then Replace the current atlas or Merge its contents. Check the choice before proceeding.</dd>
            <dt>Download</dt><dd>Download readable Markdown from the thought or atlas download controls. Use this for reading or sharing; use Export atlas for a restorable backup.</dd>
            <dt>Menu → Reset to fixture</dt><dd>Return to the prepared example, discarding this browser’s current atlas, Talk transcript, and expeditions. Export anything you want to keep first.</dd>
          </dl>
          <p>If a save warning appears, export a backup before leaving. Browser-local saving does not promise a full revision history or recovery of discarded work.</p>
        </div>
      </details>
    </div>
  </article>;
}
