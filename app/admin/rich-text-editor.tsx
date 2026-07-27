"use client";

import { useRef, useState } from "react";

type Props = { name: string; label: string; defaultValue?: string; placeholder?: string };

export function RichTextEditor({ name, label, defaultValue = "", placeholder }: Props) {
  const editor = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(defaultValue);
  const sync = () => setValue(editor.current?.innerHTML ?? "");
  const format = (command: string, argument?: string) => { editor.current?.focus(); document.execCommand(command, false, argument); sync(); };
  return <div className="rich-editor"><span className="rich-editor-label">{label}</span><div className="rich-editor-toolbar" role="toolbar" aria-label={`${label} formatting`}><button type="button" onClick={() => format("formatBlock", "h2")}>Heading</button><button type="button" onClick={() => format("bold")}><b>Bold</b></button><button type="button" onClick={() => format("italic")}><i>Italic</i></button><button type="button" onClick={() => format("insertUnorderedList")}>• List</button><button type="button" onClick={() => format("insertOrderedList")}>1. List</button><button type="button" onClick={() => { const url = window.prompt("Link URL"); if (url) format("createLink", url); }}>Link</button></div><div ref={editor} className="rich-editor-surface" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" data-placeholder={placeholder} onInput={sync} dangerouslySetInnerHTML={{ __html: defaultValue }} /><input type="hidden" name={name} value={value} /></div>;
}
