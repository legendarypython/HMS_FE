import React from 'react';
import Field from '../ui/Field';
import Icon from '../ui/Icon';

// One "investigation" block - a details textarea plus its own document
// upload/list - reused for Blood/Urine/Ultrasound/X-ray across both the
// AnteNatal and Infertility case forms (8 near-identical copies before this).
//
// `name`/`fileFieldName` must be the exact dot-path (e.g.
// "investigations.bloodInvestigation.details") the parent's handleChange/
// handleFileChange expect - id is just for label association and can be
// a simpler unique string.
const InvestigationField = ({ label, id, name, fileFieldName, value, onChange, documents, onFileChange, onRemoveDocument }) => (
  <Field label={label} htmlFor={id}>
    <textarea className="ui-textarea" id={id} name={name} rows={3} value={value} onChange={onChange} />
    <label htmlFor={`${id}Docs`} className="ui-file-upload-label">
      <Icon name="file" size={16} /> Choose Documents
    </label>
    <input type="file" id={`${id}Docs`} name={fileFieldName} multiple onChange={onFileChange} className="ui-file-upload-input" />
    {documents.map((doc, index) => (
      <div key={index} className="ui-document-chip">
        <Icon name="file" size={16} />
        <span>{doc.name}</span>
        <button type="button" onClick={() => onRemoveDocument(index)}>x</button>
      </div>
    ))}
  </Field>
);

export default InvestigationField;
