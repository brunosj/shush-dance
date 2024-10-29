import Button from '../_components/Button';

export default function NotFound() {
  return (
    <article className='py-32 text-center space-y-3'>
      <p>This page could not be found, sorry!</p>
      <div>
        <Button href='/' label='return to home' />
      </div>
    </article>
  );
}
