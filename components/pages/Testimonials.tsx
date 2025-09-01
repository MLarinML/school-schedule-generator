import { Star, Quote } from 'lucide-react'

const Testimonials = () => {
  const testimonials = [
    {
      quote: "Раньше на составление расписания уходило 2-3 дня, теперь готово за 15 минут. Сервис учитывает все нюансы нашей школы.",
      author: "Марина Петровна",
      position: "Заместитель директора",
      school: "Гимназия №1, Москва",
      rating: 5
    },
    {
      quote: "Отличный сервис! Особенно нравится объяснение конфликтов - теперь понимаю, почему не получается поставить урок в определенное время.",
      author: "Александр Иванович",
      position: "Завуч",
      school: "Лицей №15, Санкт-Петербург",
      rating: 5
    },
    {
      quote: "Используем уже полгода. Учителя довольны - УмноеРасписание стало более сбалансированным, меньше окон и конфликтов.",
      author: "Елена Сергеевна",
      position: "Директор",
      school: "Школа №42, Екатеринбург",
      rating: 5
    }
  ]



  return (
    <section className="section-padding bg-gray-50" aria-labelledby="testimonials-heading">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 
            id="testimonials-heading"
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
          >
            Что говорят наши клиенты
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Реальные отзывы от завучей и директоров школ, которые уже используют наш сервис
          </p>
        </div>

        {/* Отзывы */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 relative"
            >
              {/* Кавычки */}
              <div className="absolute -top-4 left-8">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <Quote className="w-4 h-4 text-primary-600" aria-hidden="true" />
                </div>
              </div>
              
              {/* Рейтинг */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" aria-hidden="true" />
                ))}
              </div>
              
              {/* Цитата */}
              <blockquote className="text-gray-700 mb-6 leading-relaxed">
                "{testimonial.quote}"
              </blockquote>
              
              {/* Автор */}
              <div className="border-t border-gray-100 pt-4">
                <div className="font-semibold text-gray-900">
                  {testimonial.author}
                </div>
                <div className="text-sm text-gray-600">
                  {testimonial.position}
                </div>
                <div className="text-sm text-primary-600 font-medium">
                  {testimonial.school}
                </div>
              </div>
            </div>
          ))}
        </div>

        
      </div>
    </section>
  )
}

export default Testimonials
