import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { SKILL_OPTIONS } from '../constants/skills';
import './SkillTagInput.css';

const normalize = (value) => value.trim().replace(/\s+/g, ' ');

const splitSkills = (value) => (value || '')
  .split(',')
  .map((item) => normalize(item))
  .filter(Boolean);

const SkillTagInput = ({ value, onChange, placeholder = 'Add a skill and press Enter' }) => {
  const [skills, setSkills] = useState(splitSkills(value));
  const [query, setQuery] = useState('');

  useEffect(() => {
    setSkills(splitSkills(value));
  }, [value]);

  const applySkills = (next) => {
    setSkills(next);
    onChange(next.join(', '));
  };

  const addSkill = (rawSkill) => {
    const nextSkill = normalize(rawSkill);
    if (!nextSkill) return;

    const exists = skills.some((item) => item.toLowerCase() === nextSkill.toLowerCase());
    if (exists) return;

    applySkills([...skills, nextSkill]);
    setQuery('');
  };

  const removeSkill = (skillToRemove) => {
    const nextSkills = skills.filter((item) => item !== skillToRemove);
    applySkills(nextSkills);
  };

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    return SKILL_OPTIONS
      .filter((skill) => !skills.some((item) => item.toLowerCase() === skill.toLowerCase()))
      .filter((skill) => skill.toLowerCase().includes(normalizedQuery))
      .slice(0, 8);
  }, [query, skills]);

  const handleInputKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addSkill(query);
    }
    if (event.key === 'Backspace' && !query && skills.length > 0) {
      removeSkill(skills[skills.length - 1]);
    }
  };

  return (
    <div className="skill-picker">
      <div className="skill-picker-box">
        {skills.map((skill) => (
          <span key={skill} className="skill-chip">
            {skill}
            <button type="button" onClick={() => removeSkill(skill)} aria-label={`Remove ${skill}`}>
              <X size={13} />
            </button>
          </span>
        ))}

        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
        />
      </div>

      {filteredOptions.length > 0 && (
        <div className="skill-options">
          {filteredOptions.map((option) => (
            <button key={option} type="button" onClick={() => addSkill(option)} className="skill-option">
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillTagInput;
