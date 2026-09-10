"use client";
import { useState } from "react";
import { Button, IconButton, Field, Input, Textarea, Select, Summary, MenuItem, SegmentedControl } from "./controls";
import PanelHeader from "./panel-header";
import { actions } from "./actions";

export default function Gallery() {
  const [step, setStep] = useState(2), [pressed, setPressed] = useState(false), [message, setMessage] = useState("Ready");
  return <main className="ui-gallery">
    <h1>Minerva UI reference</h1><p>Compact controls shared by every feature. Changes here apply throughout Minerva.</p>
    <section><h2>Actions and states</h2><div className="ui-gallery-row">
      <Button variant="primary" onClick={() => setMessage("Primary action completed")}>Primary action</Button>
      <Button onClick={() => setMessage("Secondary action completed")}>Secondary action</Button>
      <Button variant="quiet">Quiet action</Button><Button variant="danger">Delete</Button>
      <Button disabled>Unavailable</Button><Button busy>Working…</Button>
      <Button aria-pressed={pressed} onClick={() => setPressed(!pressed)}>Toggle selection</Button>
    </div></section>
    <section><h2>Icons and tooltips</h2><div className="ui-gallery-row">{Object.entries(actions).map(([key, action]) => <IconButton key={key} aria-label={action.label} onClick={() => setMessage(action.label)}><action.Icon /></IconButton>)}</div></section>
    <section><PanelHeader title="Expedition" image="/images/expedition-compass.png" close={() => setMessage("Panel close activated")} />
      <form onSubmit={e => { e.preventDefault(); setMessage("Form submitted"); }} className="ui-gallery-fields">
        <Field label="Title"><Input required placeholder="Give this idea a title" /></Field>
        <Field label="Direction"><Textarea rows={2} placeholder="Describe the direction…" /></Field>
        <Field label="View"><Select defaultValue="Lineage"><option>Lineage</option><option>Evolution</option><option>Constellation</option></Select></Field>
        <label><Input type="checkbox" /> Select idea</label>
        <SegmentedControl label="Maximum steps" options={[2,3,4,5]} value={step} onChange={setStep} />
        <div className="ui-gallery-row"><Button type="submit" variant="primary">Submit</Button><Button onClick={() => setMessage("Cancel did not submit")}>Cancel</Button></div>
      </form>
    </section>
    <section><h2>Disclosure and menu</h2><details><Summary>Details</Summary><p>Native keyboard disclosure with shared type and focus treatment.</p></details>
      <details><Summary variant="secondary">Menu</Summary><MenuItem onClick={() => setMessage("Menu action completed")}>Open idea</MenuItem><MenuItem disabled>Unavailable action</MenuItem></details>
    </section><p role="status">{message}</p>
  </main>;
}
