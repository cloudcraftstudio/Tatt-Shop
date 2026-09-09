const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const regex = /<MediaRenderer src=\{b\.coverUpPhotoUrl\} alt="Cover up uploaded" className="w-12 h-12 rounded object-cover border border-red-400" autoPlay=\{false\} \/>[\s\S]*?<\/a>[\s\S]*?\)\}[\s\S]*?\{b\.referencePhotoUrl && \(/;

const replacement = `<MediaRenderer src={item.imageUrl} alt={item.title} className="w-12 h-12 rounded object-cover border border-cyan-500/40" autoPlay={false} />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-heading font-bold text-white truncate">{item.title}</h4>
                      <p className="text-[10px] text-gray-400 font-mono truncate">{item.categoryLabel}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingGalleryItem(item)}
                        className="p-1.5 rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition"
                        title="Edit Piece"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await storageService.deleteGalleryItem(item.id);
                          onRefreshData();
                        }}
                        className="p-1.5 rounded-lg bg-red-900/50 text-red-400 hover:text-white hover:bg-red-600 transition"
                        title="Delete Piece"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ======================= */}
          {/*   BOOKINGS MANAGEMENT   */}
          {/* ======================= */}
          <div className="bg-[#091122]/90 backdrop-blur-md rounded-2xl border border-cyan-500/20 p-4 sm:p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="font-heading font-black text-2xl text-white flex items-center gap-3">
                <Calendar className="w-6 h-6 text-cyan-400" />
                <span>Booking Requests ({bookings.length})</span>
              </h3>
            </div>

            {bookings.length === 0 ? (
              <p className="text-sm text-gray-400 font-mono">No booking requests found.</p>
            ) : (
              <div className="space-y-4">
                {bookings.map(b => {
                  const depositStatus = b.depositStatus || 'unpaid';
                  return (
                    <div key={b.id} className="p-4 rounded-xl bg-black/60 border border-cyan-500/30 flex flex-col md:flex-row gap-4 items-start md:items-center">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-heading font-bold text-white">{b.clientName}</h4>
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-300">{b.phone}</span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-300">{b.email}</span>
                        </div>
                        <p className="text-sm text-gray-300">
                          <span className="text-cyan-400 font-bold">Idea:</span> {b.tattooIdea}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs font-mono text-gray-400">
                          <span>Placement: {b.placement}</span>
                          <span>Size: {b.approximateSize}</span>
                          {b.isCoverUp && <span className="text-red-400">Cover-Up</span>}
                        </div>
                        
                        {(b.coverUpPhotoUrl || b.referencePhotoUrl) && (
                          <div className="flex items-center gap-3 pt-1">
                            {b.coverUpPhotoUrl && (
                              <a href={b.coverUpPhotoUrl} target="_blank" rel="noreferrer">
                                <MediaRenderer src={b.coverUpPhotoUrl} alt="Cover up uploaded" className="w-12 h-12 rounded object-cover border border-red-400" autoPlay={false} />
                              </a>
                            )}
                            {b.referencePhotoUrl && (`

code = code.replace(regex, replacement);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
