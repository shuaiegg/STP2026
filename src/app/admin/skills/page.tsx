'use client';

import { useState, useEffect } from 'react';
import { getSkillConfigs, updateSkillCost, toggleSkill, createSkill } from '@/app/actions/skills';
import { useRouter } from 'next/navigation';

interface SkillConfig {
    id: string;
    name: string;
    displayName: string;
    description: string | null;
    cost: number;
    isActive: boolean;
    updatedAt: Date;
}

export default function SkillManagementPage() {
    const [skills, setSkills] = useState<SkillConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editCost, setEditCost] = useState<number>(0);

    // Add Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newSkill, setNewSkill] = useState({ name: '', displayName: '', description: '', cost: 0 });

    useEffect(() => {
        loadSkills();
    }, []);

    const loadSkills = async () => {
        try {
            const data = await getSkillConfigs();
            // @ts-ignore
            setSkills(data);
        } catch (error) {
            console.error('Failed to load skills:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (skill: SkillConfig) => {
        setEditingId(skill.id);
        setEditCost(skill.cost);
    };

    const handleSaveCost = async (id: string) => {
        try {
            await updateSkillCost(id, Number(editCost));
            setEditingId(null);
            loadSkills(); // Refresh
        } catch (error) {
            alert('Failed to update cost');
        }
    };

    const handleToggle = async (id: string) => {
        try {
            await toggleSkill(id);
            loadSkills(); // Refresh
        } catch (error) {
            alert('Failed to toggle skill');
        }
    };

    const handleCreateSkill = async () => {
        try {
            if (!newSkill.name || !newSkill.displayName) {
                alert('Name and Display Name are required');
                return;
            }
            await createSkill(newSkill);
            setIsAddModalOpen(false);
            setNewSkill({ name: '', displayName: '', description: '', cost: 0 }); // Reset
            loadSkills();
        } catch (error: any) {
            alert('Failed to create skill: ' + error.message);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Skill Management</h1>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    + Add New Skill
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th className="p-4">Display Name</th>
                            <th className="p-4">System Name</th>
                            <th className="p-4">Cost (Credits)</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Last Updated</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {skills.map((skill) => (
                            <tr key={skill.id} className="hover:bg-gray-50/50">
                                <td className="p-4">
                                    <div className="font-semibold text-gray-900">{skill.displayName}</div>
                                    <div className="text-sm text-gray-400">{skill.description}</div>
                                </td>
                                <td className="p-4">
                                    <code className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600">{skill.name}</code>
                                </td>
                                <td className="p-4">
                                    {editingId === skill.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={editCost}
                                                onChange={(e) => setEditCost(Number(e.target.value))}
                                                className="w-20 border rounded px-2 py-1"
                                            />
                                            <button onClick={() => handleSaveCost(skill.id)} className="text-green-600 hover:underline">Save</button>
                                            <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">Cancel</button>
                                        </div>
                                    ) : (
                                        <span className="font-mono font-medium text-lg">{skill.cost}</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <button
                                        onClick={() => handleToggle(skill.id)}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${skill.isActive
                                                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                            }`}
                                    >
                                        {skill.isActive ? 'Active' : 'Disabled'}
                                    </button>
                                </td>
                                <td className="p-4 text-sm text-gray-400">
                                    {new Date(skill.updatedAt).toLocaleDateString()}
                                </td>
                                <td className="p-4">
                                    {editingId !== skill.id && (
                                        <button
                                            onClick={() => handleEditClick(skill)}
                                            className="text-blue-600 hover:underline text-sm font-medium"
                                        >
                                            Edit Cost
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {skills.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        No skills found. Please run the seed script.
                    </div>
                )}
            </div>

            {/* Add Skill Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add New Skill</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                                <input
                                    type="text"
                                    className="w-full border rounded-lg px-3 py-2"
                                    placeholder="e.g. SEO Audit Tool"
                                    value={newSkill.displayName}
                                    onChange={(e) => setNewSkill({ ...newSkill, displayName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">System Name (ID)</label>
                                <input
                                    type="text"
                                    className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
                                    placeholder="e.g. SEO_AUDIT_TOOL"
                                    value={newSkill.name}
                                    onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                                />
                                <p className="text-xs text-gray-400 mt-1">Must be unique, uppercase, no spaces.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cost (Credits)</label>
                                <input
                                    type="number"
                                    className="w-full border rounded-lg px-3 py-2"
                                    value={newSkill.cost}
                                    onChange={(e) => setNewSkill({ ...newSkill, cost: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    className="w-full border rounded-lg px-3 py-2"
                                    rows={3}
                                    value={newSkill.description}
                                    onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateSkill}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Create Skill
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-8 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
                <h3 className="font-bold mb-2">💡 Tips</h3>
                <ul className="list-disc list-inside space-y-1">
                    <li>Changing the cost affects all <strong>future</strong> generations immediately.</li>
                    <li>Disabling a skill will prevent users from using it (API will return 400/402).</li>
                    <li>The <strong>System Name</strong> is used in the codebase to charge users. Make sure your developers know this ID.</li>
                </ul>
            </div>
        </div>
    );
}
