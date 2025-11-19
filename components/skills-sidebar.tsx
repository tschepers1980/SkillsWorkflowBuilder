'use client';

import { SKILL_REGISTRY, getAllCategories } from '@/lib/skill-registry';
import * as Icons from 'lucide-react';
import { useState } from 'react';

interface SkillsSidebarProps {
  onDragStart: (event: React.DragEvent, skillId: string) => void;
}

export default function SkillsSidebar({ onDragStart }: SkillsSidebarProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const categories = getAllCategories();

  const filteredSkills = selectedCategory
    ? SKILL_REGISTRY.filter(skill => skill.category === selectedCategory)
    : SKILL_REGISTRY;

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
      <h2 className="text-lg font-bold mb-4 text-gray-800">Skills</h2>

      {/* Category Filter */}
      <div className="mb-4">
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory(e.target.value || null)}
        >
          <option value="">Alle Categorieën</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* Skills List */}
      <div className="space-y-2">
        {filteredSkills.map(skill => {
          const IconComponent = skill.icon in Icons
            ? Icons[skill.icon as keyof typeof Icons]
            : Icons.Box;

          return (
            <div
              key={skill.id}
              draggable
              onDragStart={(e) => onDragStart(e, skill.id)}
              className="
                p-3 bg-white border border-gray-200 rounded-lg cursor-grab
                hover:border-blue-400 hover:shadow-md transition-all
                active:cursor-grabbing active:shadow-lg
              "
            >
              <div className="flex items-start gap-2">
                <div className="p-1.5 bg-blue-100 rounded mt-0.5">
                  {/* @ts-ignore */}
                  <IconComponent className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-800 mb-1">
                    {skill.name}
                  </div>
                  <div className="text-xs text-gray-500 line-clamp-2">
                    {skill.description}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {skill.category}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Tip:</strong> Sleep een skill naar de canvas om een node toe te voegen.
          Verbind nodes door van de groene cirkel naar de blauwe cirkel te slepen.
        </p>
      </div>
    </div>
  );
}
